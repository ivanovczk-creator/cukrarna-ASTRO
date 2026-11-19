/**
 * POST /api/create-payment
 * Zaregistruje objednávku jako „čeká na platbu“ a založí platbu v Comgate (REST API v2.0).
 *
 * Body (JSON): { orderId, email, name, phone?, items: [{ name, quantity }] }
 * Odpověď:     { redirect: "https://pay1.comgate.cz/...", transId }
 *
 * Částka se vždy přepočítá na serveru z data.json (cena z prohlížeče se nepoužije), v haléřích, měna CZK.
 * Platba při převzetí tuto funkci nevolá – web ji volá jen při volbě „Online“.
 *
 * Potřebné ENV: COMGATE_MERCHANT_ID (524485), COMGATE_SECRET, COMGATE_TEST – viz netlify/lib/comgate.mjs.
 */
import { priceItems } from '../lib/catalog.mjs';
import { ORDER_ID_RE, createPayment, getConfig, isConfigured } from '../lib/comgate.mjs';
import { readPayment, settlePayment, writePayment } from '../lib/payment-flow.mjs';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const cfg = getConfig();
  if (!isConfigured(cfg)) return json({ error: 'Online platby nejsou nakonfigurovány' }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Neplatný JSON' }, 400);
  }

  const { orderId, email, name, items } = body ?? {};
  if (!ORDER_ID_RE.test(orderId ?? '')) return json({ error: 'Neplatné číslo objednávky' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return json({ error: 'Neplatný e-mail' }, 400);

  let priced;
  try {
    priced = priceItems(items);
  } catch (e) {
    return json({ error: e.message }, 400);
  }
  const amount = Math.round(priced.total * 100); // haléře
  if (amount < 100 || amount > 100000000) return json({ error: 'Částka je mimo povolený rozsah online platby' }, 400);

  // 1) evidence: objednávka čeká na platbu
  const now = new Date().toISOString();
  let record = await readPayment(orderId);
  if (record?.status === 'PAID') return json({ error: 'Objednávka je již zaplacena' }, 409);
  if (record && record.amount !== amount) return json({ error: 'Částka objednávky se liší od založené platby' }, 409);

  record = {
    orderId,
    status: record?.status === 'AUTHORIZED' ? 'AUTHORIZED' : 'PENDING',
    amount,
    curr: 'CZK',
    test: cfg.test,
    transIds: record?.transIds ?? [],
    createdAt: record?.createdAt ?? now,
    updatedAt: now,
    syncedStatus: null,
  };
  await writePayment(record);

  // 2) založení platby v Comgate
  let created;
  try {
    created = await createPayment(cfg, { orderId, amount, email, name });
  } catch (e) {
    console.error('[create-payment]', orderId, e.message);
    if (record.transIds.length === 0) {
      // objednávku je potřeba v Pohodě označit, že online platba nezačala (best-effort)
      await settlePayment(cfg, record, 'CANCELLED').catch(() => {});
    }
    return json({ error: 'Platbu se nepodařilo založit' }, 502);
  }

  record = {
    ...record,
    transIds: [...record.transIds, created.transId],
    transId: created.transId,
    redirect: created.redirect,
    updatedAt: new Date().toISOString(),
  };
  await writePayment(record);

  console.log('[create-payment] založeno', JSON.stringify({ orderId, transId: created.transId, amount, test: cfg.test }));
  return json({ redirect: created.redirect, transId: created.transId });
};

export const config = {
  path: '/api/create-payment',
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
