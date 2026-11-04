/**
 * POST /.netlify/functions/comgate-callback
 * Push notifikace z Comgate o změně stavu platby.
 *
 * Nastavení v Comgate Klientském portálu (Nastavení → Propojení obchodů → URL):
 *   URL pro předání výsledku platby:  https://cukrarstviblahutovi.cz/.netlify/functions/comgate-callback
 *   URL při úspěchu (zaplaceno):      https://cukrarstviblahutovi.cz/dekujeme?platba=zaplaceno&refId=${refId}
 *   URL při zrušení / chybě:          https://cukrarstviblahutovi.cz/dekujeme?platba=zrusena&refId=${refId}
 *
 * Comgate očekává odpověď "code=0&message=OK" (jinak notifikaci opakuje).
 * Stav platby se ještě ověří dotazem na /v1.0/status – tělu požadavku se nevěří naslepo.
 */
import { forwardToMake } from '../lib/make.mjs';

const COMGATE_STATUS_URL = 'https://payments.comgate.cz/v1.0/status';
const reply = (code, message, status = 200) =>
  new Response(`code=${code}&message=${encodeURIComponent(message)}`, {
    status,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

export default async (req) => {
  if (req.method !== 'POST') return reply(1, 'Method not allowed', 405);

  const merchant = process.env.COMGATE_MERCHANT;
  const secret = process.env.COMGATE_SECRET;
  if (!merchant || !secret) return reply(1, 'Not configured', 503);

  const notif = Object.fromEntries(new URLSearchParams(await req.text()));
  if (notif.merchant !== merchant || notif.secret !== secret || !notif.transId) {
    return reply(1, 'Unauthorized', 401);
  }

  // Ověření stavu přímo u Comgate
  const statusRes = await fetch(COMGATE_STATUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ merchant, secret, transId: notif.transId }),
  });
  const status = Object.fromEntries(new URLSearchParams(await statusRes.text()));
  if (status.code !== '0' || status.refId !== notif.refId) {
    console.error('[comgate-callback] ověření stavu selhalo', status.code, status.message);
    return reply(1, 'Status check failed', 502);
  }

  try {
    await forwardToMake({
      event: status.status === 'PAID' ? 'payment.paid' : 'payment.status_changed',
      orderId: status.refId,
      transId: notif.transId,
      paymentStatus: status.status, // PENDING | PAID | CANCELLED | AUTHORIZED
      amount: Number(status.price) / 100,
      currency: status.curr,
      method: status.method,
      email: status.email,
      test: status.test === 'true',
      receivedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[comgate-callback] Make selhal', e);
    return reply(1, 'Forward failed', 502); // Comgate zkusí znovu
  }

  return reply(0, 'OK');
};
