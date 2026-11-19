/**
 * POST /api/comgate-notify  – push notifikace (předání výsledku platby na pozadí) z Comgate.
 *
 * Tuto adresu nastavte v Comgate Klientském portálu jako „URL pro předání výsledku platby“ (url_push).
 *
 * Postup:
 *  1) z těla (x-www-form-urlencoded / JSON) se čte transId, refId, status (+ merchant, secret);
 *  2) merchant musí odpovídat COMGATE_MERCHANT_ID a pokud přišel secret, musí sedět s COMGATE_SECRET;
 *  3) skutečný stav, částka a měna se znovu načtou z Comgate API (autorizované heslem) – tělu notifikace se nevěří;
 *  4) stav se uloží k objednávce a propíše do Apps Scriptu / XML pro Pohodu (PAID → „ZAPLACENO ONLINE“);
 *  5) odpověď 200 „code=0&message=OK“. Při chybě (Comgate API / Apps Script nedostupný) vracíme 5xx,
 *     takže Comgate notifikaci zopakuje.
 */
import {
  checkCanonical,
  fetchPaymentStatus,
  getConfig,
  isConfigured,
  normalizeStatus,
  readParams,
  safeEqual,
} from '../lib/comgate.mjs';
import { readPayment, settlePayment } from '../lib/payment-flow.mjs';

const reply = (text, status = 200) =>
  new Response(text, { status, headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'Cache-Control': 'no-store' } });
const ok = () => reply('code=0&message=OK');
const fail = (message, status) => reply(`code=1400&message=${encodeURIComponent(message)}`, status);

export default async (req) => {
  if (req.method !== 'POST') return fail('Method not allowed', 405);

  const cfg = getConfig();
  if (!isConfigured(cfg)) return fail('not configured', 503);

  const params = await readParams(req);
  const transId = String(params.transId ?? '').trim();
  const refId = String(params.refId ?? '').trim();
  if (!transId || !refId) return fail('missing transId or refId', 400);

  // ověření příchozích parametrů
  if (params.merchant !== undefined && String(params.merchant) !== cfg.merchant) {
    console.error('[comgate-notify] cizí merchant', params.merchant);
    return fail('invalid merchant', 403);
  }
  if (params.secret !== undefined && !safeEqual(params.secret, cfg.secret)) {
    console.error('[comgate-notify] špatné heslo (secret) v notifikaci', refId);
    return fail('invalid secret', 403);
  }
  if (params.secret === undefined) {
    console.warn('[comgate-notify] notifikace bez secret – spoléháme na ověření stavu přes Comgate API', refId);
  }

  const record = await readPayment(refId);
  if (!record) {
    // neznámá objednávka (např. zkušební platba z portálu) – není co aktualizovat, opakování by nepomohlo
    console.warn('[comgate-notify] neznámá objednávka', refId, transId);
    return ok();
  }

  // skutečný stav přímo z Comgate
  let canonical;
  try {
    canonical = await fetchPaymentStatus(cfg, transId);
  } catch (err) {
    console.error('[comgate-notify] Comgate status nedostupný', refId, err.message);
    return fail('status unavailable', 502); // Comgate zopakuje
  }

  const problem = checkCanonical(record, canonical, { pushedRefId: refId, pushedTransId: transId });
  if (problem) {
    console.error('[comgate-notify] odmítnuto:', problem, JSON.stringify({ refId, transId }));
    return fail('verification failed', 400);
  }

  const status = normalizeStatus(canonical.status);
  const result = await settlePayment(cfg, record, status, transId);
  console.log('[comgate-notify]', JSON.stringify({ refId, transId, status, stored: result.record.status, synced: result.synced }));

  if (!result.synced) {
    console.error('[comgate-notify] stav uložen, ale nepropsán do objednávky:', result.syncError);
    return fail('order update failed', 500); // Comgate zopakuje
  }
  return ok();
};

export const config = { path: '/api/comgate-notify' };
