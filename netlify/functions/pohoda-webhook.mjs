/**
 * POST /.netlify/functions/pohoda-webhook
 * Webhook z Netlify Forms (Site configuration → Notifications → Form submission notifications →
 * Outgoing webhook). Surové tělo požadavku se beze změny přepošle do Google Apps Script
 * (zpracování objednávek / export pro POHODU).
 *
 * Apps Script na POST zareaguje tak, že skript spustí a odpoví 302 s hlavičkou Location na
 * adresu, odkud se vyzvedne jeho výstup. Přesměrování proto řešíme ručně (redirect: "manual"):
 *  - 302 / 303 → další požadavek je GET na Location (tělo se NEPOSÍLÁ znovu, skript už proběhl);
 *  - 307 / 308 → požadavek se zopakuje stejnou metodou i tělem (pravidla HTTP);
 *  - 200 → hotovo.
 *
 * Odpovědi:
 *  - jiná metoda než POST → 405
 *  - úspěch → 200 { ok: true, upstreamStatus, redirects }
 *  - chyba (síť, chybný stav Apps Scriptu, přesměrování bez Location, smyčka) → 500 { ok: false, error, ... }
 *    a do logu (console.error) jde stavový kód + prvních 1000 znaků odpovědi.
 */
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwbbUYAH_qt6DVzzH35d4WLWFyCCyyNuLGiVZnm73UaKUT_Si1L28NfEkbv_b0DISvJ/exec';

const MAX_REDIRECTS = 5;
const LOG_BODY_CHARS = 1000;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

/** Chyba volání Apps Scriptu s dohledatelným stavem a začátkem odpovědi. */
class UpstreamError extends Error {
  constructor(message, { status = null, body = '', redirects = 0 } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.body = body;
    this.redirects = redirects;
  }
}

const snippet = async (res) => {
  try {
    return (await res.text()).slice(0, LOG_BODY_CHARS);
  } catch {
    return '';
  }
};

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  try {
    const rawBody = await req.text();
    const contentType = req.headers.get('content-type') || 'application/json';

    let url = APPS_SCRIPT_URL;
    let method = 'POST';
    let body = rawBody;
    let redirects = 0;

    for (;;) {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { 'Content-Type': contentType } : {},
        body,
        redirect: 'manual',
      });

      if (REDIRECT_CODES.has(res.status)) {
        const location = res.headers.get('location');
        const text = await snippet(res);
        if (!location) {
          throw new UpstreamError(`Apps Script vrátil přesměrování ${res.status} bez hlavičky Location`, {
            status: res.status,
            body: text,
            redirects,
          });
        }
        if (redirects >= MAX_REDIRECTS) {
          throw new UpstreamError(`Příliš mnoho přesměrování (>${MAX_REDIRECTS}) od Apps Scriptu`, {
            status: res.status,
            body: text,
            redirects,
          });
        }

        redirects += 1;
        url = new URL(location, url).href;
        if (res.status !== 307 && res.status !== 308) {
          // 301/302/303: skript už proběhl, na Location se jen vyzvedne odpověď
          method = 'GET';
          body = undefined;
        }
        continue;
      }

      if (!res.ok) {
        throw new UpstreamError(`Apps Script vrátil HTTP ${res.status}`, {
          status: res.status,
          body: await snippet(res),
          redirects,
        });
      }

      return json({ ok: true, upstreamStatus: res.status, redirects });
    }
  } catch (err) {
    if (err instanceof UpstreamError) {
      console.error(`pohoda-webhook: chyba Apps Scriptu, status=${err.status}, odpověď (prvních ${LOG_BODY_CHARS} znaků): ${err.body}`);
      return json(
        { ok: false, error: err.message, upstreamStatus: err.status, redirects: err.redirects },
        500,
      );
    }
    console.error('pohoda-webhook: volání Apps Scriptu selhalo:', err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
};
