/**
 * Evidence plateb (Netlify Blobs) a propsání výsledku platby do zpracování objednávek (Apps Script → XML pro Pohodu).
 * Používají ho create-payment, comgate-notify a payment-status.
 */
import { getStore } from '@netlify/blobs';
import { FINAL_STATUSES, applyStatus, normalizeStatus } from './comgate.mjs';

const STORE_NAME = 'payments';
const FORWARD_TIMEOUT_MS = 6000;

const store = () => getStore({ name: STORE_NAME, consistency: 'strong' });

export const readPayment = (orderId) => store().get(orderId, { type: 'json' });
export const writePayment = (record) => store().setJSON(record.orderId, record);

/**
 * Pošle výsledek platby do Apps Scriptu (přes pohoda-webhook, který řeší přesměrování a token).
 * Apps Script přepíše poznámku/text v XML objednávky a pošle interní e-mail. Operace je idempotentní.
 * @throws Error když se nepodaří doručit nebo Apps Script vrátí chybu (např. XML objednávky ještě neexistuje)
 */
export async function forwardPaymentUpdate(cfg, record, status) {
  const payload = {
    action: 'payment-update',
    orderId: record.orderId,
    status,
    transId: record.paidTransId ?? (record.transIds ?? []).at(-1) ?? null,
    amount: record.amount,
    currency: record.curr,
    paidAt: record.paidAt ?? null,
    test: record.test,
  };

  const res = await fetch(`${cfg.siteUrl}/.netlify/functions/pohoda-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok !== true) {
    throw new Error(`Propsání platby do objednávky selhalo (HTTP ${res.status}): ${data.error ?? 'bez detailu'}`);
  }
  return data;
}

/**
 * Uloží nový stav platby a (u PAID / CANCELLED) ho propíše do objednávky.
 * @returns {{ record: object, synced: boolean, syncError?: string }}
 *   synced=false znamená, že stav je uložený, ale do objednávky se ho nepodařilo propsat –
 *   push notifikace pak vrací chybu, aby ji Comgate zopakoval.
 */
export async function settlePayment(cfg, record, rawStatus, transId) {
  const status = normalizeStatus(rawStatus);
  if (!status) return { record, synced: true };

  let { record: next } = applyStatus(record, status, transId);
  await writePayment(next);

  const target = next.status;
  if (!FINAL_STATUSES.includes(target) || next.syncedStatus === target) {
    return { record: next, synced: true };
  }

  try {
    await forwardPaymentUpdate(cfg, next, target);
    next = { ...next, syncedStatus: target, syncError: null };
    await writePayment(next);
    return { record: next, synced: true };
  } catch (err) {
    next = { ...next, syncError: String(err.message ?? err).slice(0, 300) };
    await writePayment(next).catch(() => {});
    return { record: next, synced: false, syncError: next.syncError };
  }
}
