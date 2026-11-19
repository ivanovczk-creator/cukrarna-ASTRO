/**
 * GET /api/payment-status?refId=BL-20261104-7K3F
 * Stav online platby pro stránku /dekujeme: { status: "PAID" | "PENDING" | "CANCELLED" | "UNKNOWN" }.
 *
 * Stav se bere z naší evidence plateb (plní ji push notifikace z Comgate). Je-li platba stále čekající,
 * zeptáme se navíc přímo Comgate API – parametry v návratové URL zákazníka by šly podvrhnout,
 * proto je stránka /dekujeme nikdy nepovažuje za důkaz zaplacení. Odpověď neobsahuje žádné osobní údaje.
 */
import {
  ORDER_ID_RE,
  checkCanonical,
  fetchPaymentStatus,
  getConfig,
  isConfigured,
  normalizeStatus,
  publicStatus,
} from '../lib/comgate.mjs';
import { readPayment, settlePayment } from '../lib/payment-flow.mjs';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const refId = new URL(req.url).searchParams.get('refId') ?? '';
  if (!ORDER_ID_RE.test(refId)) return json({ status: 'UNKNOWN' });

  let record;
  try {
    record = await readPayment(refId);
  } catch (err) {
    console.error('[payment-status] evidence plateb nedostupná', err.message);
    return json({ status: 'UNKNOWN' });
  }
  if (!record) return json({ status: 'UNKNOWN' });

  // čekající platbu zkusíme ověřit přímo v Comgate (push notifikace mohla být zpožděná)
  const cfg = getConfig();
  const transId = record.transId ?? record.transIds?.at(-1);
  if (record.status === 'PENDING' && transId && isConfigured(cfg)) {
    try {
      const canonical = await fetchPaymentStatus(cfg, transId);
      const status = normalizeStatus(canonical.status);
      const problem = checkCanonical(record, canonical, { pushedRefId: refId, pushedTransId: transId });
      if (!problem && status && status !== 'PENDING') {
        record = (await settlePayment(cfg, record, status, transId)).record;
      } else if (problem) {
        console.error('[payment-status] odmítnuto:', problem, refId);
      }
    } catch (err) {
      console.warn('[payment-status] Comgate status nedostupný', refId, err.message);
    }
  }

  return json({ status: publicStatus(record) });
};

export const config = {
  path: '/api/payment-status',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
