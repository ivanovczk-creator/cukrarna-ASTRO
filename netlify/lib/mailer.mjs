/**
 * Odesílání potvrzení zákazníkům přes Resend (https://resend.com) – záložní cesta mimo Google,
 * dokud má nová doména v Google Workspace omezené automatické odesílání (chyba 69585).
 * Jen server (Netlify Functions). Klíč RESEND_API_KEY nikdy nepatří do klientského kódu.
 *
 * Proměnné prostředí:
 *   RESEND_API_KEY  – API klíč (bez něj se tato cesta nepoužije a potvrzení posílá Apps Script sám)
 *   MAIL_FROM       – adresa odesílatele na ověřené doméně (výchozí objednavky@cukrarstviblahutovi.cz)
 */
const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'objednavky@cukrarstviblahutovi.cz';
const DEFAULT_TIMEOUT_MS = 5000;

export const isExternalMailEnabled = () => Boolean(process.env.RESEND_API_KEY);

/** Jméno odesílatele bez znaků, které by rozbily hlavičku From. */
const cleanName = (name) => String(name ?? '').replace(/["<>\r\n]/g, '').trim();

/**
 * @param {{ to: string, subject: string, text: string, html?: string, fromName?: string, replyTo?: string }} mail
 * @param {{ idempotencyKey?: string, timeoutMs?: number }} [opts]
 * @returns {Promise<{ ok: true, id: string | null } | { ok: false, error: string }>}
 */
export async function sendCustomerMail(mail, opts = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY není nastaven' };

  const from = process.env.MAIL_FROM || DEFAULT_FROM;
  const name = cleanName(mail.fromName);

  const body = {
    from: name ? `${name} <${from}>` : from,
    to: [mail.to],
    subject: mail.subject,
    text: mail.text,
    ...(mail.html ? { html: mail.html } : {}),
    ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.message || data?.error || `HTTP ${res.status}`;
      return { ok: false, error: `Resend ${res.status}: ${String(detail).slice(0, 200)}` };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    const timeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return { ok: false, error: timeout ? 'Resend: časový limit' : `Resend: ${String(err?.message ?? err).slice(0, 200)}` };
  }
}
