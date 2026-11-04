/**
 * POST /.netlify/functions/create-payment
 * Založí platbu u Comgate (API v1.0) a vrátí URL platební brány.
 *
 * Body (JSON): { orderId, email, name, phone?, items: [{ name, quantity }] }
 * Odpověď:     { redirect: "https://payments.comgate.cz/client/instructions/index?id=..." }
 *
 * ENV (Netlify → Environment variables):
 *   COMGATE_MERCHANT   ID e-shopu z Comgate Klientského portálu
 *   COMGATE_SECRET     heslo pro API (Připojení obchodů → konkrétní propojení)
 *   COMGATE_TEST       "true" = testovací platby (výchozí true, dokud nenastavíte "false")
 */
import { priceItems } from '../lib/catalog.mjs';

const COMGATE_CREATE_URL = 'https://payments.comgate.cz/v1.0/create';
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const merchant = process.env.COMGATE_MERCHANT;
  const secret = process.env.COMGATE_SECRET;
  if (!merchant || !secret) return json({ error: 'Online platby nejsou nakonfigurovány' }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Neplatný JSON' }, 400);
  }

  const { orderId, email, name, items } = body ?? {};
  if (!/^BL-\d{8}-[A-Z0-9]{4}$/.test(orderId ?? '')) return json({ error: 'Neplatné číslo objednávky' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return json({ error: 'Neplatný e-mail' }, 400);

  let priced;
  try {
    priced = priceItems(items);
  } catch (e) {
    return json({ error: e.message }, 400);
  }

  const params = new URLSearchParams({
    merchant,
    secret,
    test: process.env.COMGATE_TEST === 'false' ? 'false' : 'true',
    price: String(Math.round(priced.total * 100)), // Comgate chce haléře
    curr: 'CZK',
    label: `Objednavka ${orderId}`.slice(0, 16),
    refId: orderId,
    method: 'ALL',
    email,
    fullName: String(name ?? '').slice(0, 100),
    country: 'CZ',
    lang: 'cs',
    prepareOnly: 'true', // vrátí redirect URL místo přímého přesměrování
  });

  let res;
  try {
    res = await fetch(COMGATE_CREATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
  } catch (e) {
    console.error('[create-payment] Comgate nedostupný', e);
    return json({ error: 'Platební brána je nedostupná' }, 502);
  }

  const result = Object.fromEntries(new URLSearchParams(await res.text()));
  if (result.code !== '0' || !result.redirect) {
    console.error('[create-payment] Comgate chyba', result.code, result.message);
    return json({ error: 'Platbu se nepodařilo založit' }, 502);
  }

  return json({ redirect: result.redirect, transId: result.transId });
};
