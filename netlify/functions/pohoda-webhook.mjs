/**
 * POST /.netlify/functions/pohoda-webhook
 * Webhook z Netlify Forms (Site configuration → Notifications → Form submission notifications →
 * Outgoing webhook). Surové tělo požadavku se beze změny přepošle do Google Apps Script
 * (zpracování objednávek / export pro POHODU).
 *
 * Content-Type se přeposílá tak, jak přišel (Netlify Forms webhook posílá application/json;
 * v Apps Scriptu čtěte JSON.parse(e.postData.contents)).
 *
 * Přesměrování řešíme ručně (redirect: "manual"), protože Apps Script na POST odpoví 302:
 * skript se spustí už při tomto POSTu a Location slouží jen k vyzvednutí jeho výstupu.
 *  - 301 / 302 / 303 → další požadavek je GET na Location (tělo se NEPOSÍLÁ znovu);
 *  - 307 / 308       → opakuje se stejná metoda i tělo;
 *  - Location na přihlášení Google (accounts.google.com) nebo mimo Google → chyba;
 *  - 200 s chybovou stránkou („Přístup zamítnut“ apod.) nebo JSON { ok: false } → chyba.
 *
 * Odpovědi:
 *  - jiná metoda než POST → 405
 *  - úspěch → 200 { ok: true, upstreamStatus, redirects, redirectUrl, responsePreview }
 *  - chyba  → 500 { ok: false, error, hint?, upstreamStatus, redirectUrl, redirects, sentContentType, responsePreview }
 *    (responsePreview = prvních 500 znaků odpovědi, bez HTML značek) + console.error.
 */
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwbbUYAH_qt6DVzzH35d4WLWFyCCyyNuLGiVZnm73UaKUT_Si1L28NfEkbv_b0DISvJ/exec';

const MAX_REDIRECTS = 5;
const PREVIEW_CHARS = 500;
const LOG_CHARS = 1000;
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const GOOGLE_HOST = /(^|\.)(google\.com|googleusercontent\.com)$/i;
const LOGIN_HOST = /^accounts\.google\.[a-z.]+$/i;
const ACCESS_DENIED_PAGE = /Přístup zamítnut|Potřebujete přístup|Access denied|You need access|Sign in - Google Accounts/i;

const HINTS = {
  login:
    'Apps Script vyžaduje přihlášení. V editoru skriptu: Nasadit → Spravovat nasazení → Upravit → „Kdo má přístup“ = „Kdokoli“ (Anyone) a uložit novou verzi.',
  denied:
    'Google nepustil anonymní požadavek. V editoru skriptu: Nasadit → Spravovat nasazení → Upravit → „Spustit jako“ = Já, „Kdo má přístup“ = „Kdokoli“ (Anyone) a nasadit novou verzi. Zkontrolujte také, že URL končí /exec a patří k aktuálnímu nasazení.',
  notFound: 'URL /exec neexistuje nebo nasazení bylo smazáno – zkopírujte aktuální URL z Nasadit → Spravovat nasazení.',
};

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

/** Chyba volání Apps Scriptu s údaji potřebnými pro diagnostiku. */
class UpstreamError extends Error {
  constructor(message, { status = null, preview = '', redirectUrl = null, redirects = 0, hint } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.preview = preview;
    this.redirectUrl = redirectUrl;
    this.redirects = redirects;
    this.hint = hint;
  }
}

/** Text odpovědi bez <script>/<style> a HTML značek, zkrácený na `limit` znaků. */
async function readPreview(res, limit = LOG_CHARS) {
  try {
    const raw = await res.text();
    return raw
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, limit);
  } catch {
    return '';
  }
}

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  const sentContentType = req.headers.get('content-type') || 'application/json';
  let redirectUrl = null;
  let redirects = 0;

  try {
    const rawBody = await req.text();

    let url = APPS_SCRIPT_URL;
    let method = 'POST';
    let body = rawBody;

    for (;;) {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { 'Content-Type': sentContentType } : {},
        body,
        redirect: 'manual',
      });

      // --- přesměrování ---
      if (REDIRECT_CODES.has(res.status)) {
        const location = res.headers.get('location');
        const preview = await readPreview(res);
        const ctx = { status: res.status, preview, redirectUrl: location ?? redirectUrl, redirects };

        if (!location) {
          throw new UpstreamError(`Apps Script vrátil přesměrování ${res.status} bez hlavičky Location`, ctx);
        }
        const next = new URL(location, url);
        redirectUrl = next.href;
        ctx.redirectUrl = redirectUrl;

        if (LOGIN_HOST.test(next.hostname)) {
          throw new UpstreamError('Apps Script přesměroval na přihlášení Google (nasazení není veřejné)', {
            ...ctx,
            hint: HINTS.login,
          });
        }
        if (!GOOGLE_HOST.test(next.hostname)) {
          throw new UpstreamError(`Apps Script přesměroval na nečekanou doménu (${next.hostname})`, ctx);
        }
        if (redirects >= MAX_REDIRECTS) {
          throw new UpstreamError(`Příliš mnoho přesměrování (>${MAX_REDIRECTS}) od Apps Scriptu`, ctx);
        }

        redirects += 1;
        url = next.href;
        if (res.status !== 307 && res.status !== 308) {
          method = 'GET';
          body = undefined;
        }
        continue;
      }

      // --- konečná odpověď ---
      const preview = await readPreview(res);
      const ctx = { status: res.status, preview, redirectUrl, redirects };

      if (!res.ok) {
        const hint = res.status === 401 || res.status === 403 ? HINTS.denied : res.status === 404 ? HINTS.notFound : undefined;
        throw new UpstreamError(`Apps Script vrátil HTTP ${res.status}`, { ...ctx, hint });
      }
      if (ACCESS_DENIED_PAGE.test(preview)) {
        throw new UpstreamError('Apps Script vrátil stránku o odepřeném přístupu / přihlášení', { ...ctx, hint: HINTS.denied });
      }
      try {
        const parsed = JSON.parse(preview);
        if (parsed && (parsed.ok === false || parsed.success === false || parsed.error)) {
          throw new UpstreamError(`Apps Script ohlásil chybu: ${String(parsed.error ?? 'ok=false').slice(0, 200)}`, ctx);
        }
      } catch (e) {
        if (e instanceof UpstreamError) throw e; // JSON.parse selhal = odpověď není JSON, to je v pořádku
      }

      return json({
        ok: true,
        upstreamStatus: res.status,
        redirects,
        redirectUrl,
        responsePreview: preview.slice(0, PREVIEW_CHARS),
      });
    }
  } catch (err) {
    if (err instanceof UpstreamError) {
      console.error(
        `pohoda-webhook: ${err.message} | upstreamStatus=${err.status} redirectUrl=${err.redirectUrl} redirects=${err.redirects} contentType=${sentContentType} | responsePreview: ${err.preview.slice(0, LOG_CHARS)}`,
      );
      return json(
        {
          ok: false,
          error: err.message,
          ...(err.hint ? { hint: err.hint } : {}),
          upstreamStatus: err.status,
          redirectUrl: err.redirectUrl,
          redirects: err.redirects,
          sentContentType,
          responsePreview: err.preview.slice(0, PREVIEW_CHARS),
        },
        500,
      );
    }

    console.error('pohoda-webhook: volání Apps Scriptu selhalo:', err);
    return json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        upstreamStatus: null,
        redirectUrl,
        redirects,
        sentContentType,
        responsePreview: '',
      },
      500,
    );
  }
};
