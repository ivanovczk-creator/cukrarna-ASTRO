/**
 * Odeslání události do Make.com (Custom webhook).
 *
 * ENV:
 *   MAKE_WEBHOOK_URL     URL z modulu "Webhooks → Custom webhook" (bez něj se odeslání přeskočí)
 *   MAKE_WEBHOOK_SECRET  volitelné; posílá se v hlavičce x-make-apikey (v Make ji ověřte filtrem
 *                        nebo nastavte "API key authentication" na webhooku)
 */
export async function forwardToMake(payload) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) {
    console.warn('[make] MAKE_WEBHOOK_URL není nastavena – událost se neodesílá:', payload.event);
    return { skipped: true };
  }

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MAKE_WEBHOOK_SECRET) headers['x-make-apikey'] = process.env.MAKE_WEBHOOK_SECRET;

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    throw new Error(`Make webhook odpověděl ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return { ok: true };
}
