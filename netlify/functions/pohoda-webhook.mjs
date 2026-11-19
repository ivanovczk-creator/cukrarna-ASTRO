/**
 * POST /.netlify/functions/pohoda-webhook
 * Přeposílá webhook z Netlify Forms do Google Apps Scriptu (Cukrarstvi_Objednavky_Pohoda).
 */
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwbbUYAH_qt6DVzzH35d4WLWFyCCyyNuLGiVZnm73UaKUT_Si1L28NfEkbv_b0DISvJ/exec';

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const PREVIEW_CHARS = 500;
const LOG_CHARS = 1000;

const REDIRECT_GET_CODES = new Set([301, 302, 303]);
const REDIRECT_PRESERVE_CODES = new Set([307, 308]);
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

const ALLOWED_REDIRECT_HOSTS = new Set([
  'script.google.com',
  'script.googleusercontent.com',
  'docs.google.com',
]);

const ACCESS_DENIED_PAGE =
  /(přístup zamítnut|potřebujete přístup|access denied|request access|sign in - google accounts|přihlásit se – účty google)/i;

const HINTS = {
  login:
    'Apps Script vyžaduje přihlášení. V editoru skriptu: Implementovat → Spravovat implementace → Upravit → „Kdo má přístup“ = „Kdokoli“ (Anyone) → Nová verze → Implementovat.',
  denied:
    'Google nepustil anonymní požadavek. V editoru skriptu: Implementovat → Spravovat implementace → Upravit → „Provést jako“ = Já, „Kdo má přístup“ = „Kdokoli“ (Anyone) → Nová verze → Implementovat.',
  notFound:
    'URL /exec neexistuje nebo nasazení bylo smazáno – zkopírujte aktuální URL z Implementovat → Spravovat implementace.',
  unauthorized:
    'Token nesedí: proměnná WEBHOOK_TOKEN v Netlify musí být stejná jako vlastnost skriptu WEBHOOK_TOKEN (Nastavení projektu → Vlastnosti skriptu).',
  noJson:
    'Apps Script nevrátil JSON { ok: true }. Zkontrolujte, že je nasazená nová verze kódu (Nová verze → Implementovat) a podívejte se do Spuštění.',
  timeout: `Apps Script neodpověděl do ${TIMEOUT_MS / 1000} s. Skript mohl běžet – zkontrolujte Spuštění a složku s XML; opakované odeslání je bezpečné (duplicate).`,
};

class UpstreamError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = details.status ?? null;
    this.redirectUrl = details.redirectUrl ?? null;
    this.redirects = details.redirects ?? 0;
    this.preview = details.preview ?? '';
    this.hint = details.hint ?? null;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function toPreview(rawText, limit = LOG_CHARS) {
  return String(rawText || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

async function readResponseSafe(res) {
  try {
    const raw = (await res.text()).slice(0, 20000);
    return {
      text: raw,
      preview: toPreview(raw, LOG_CHARS),
    };
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw err;
    }
    return { text: '', preview: '' };
  }
}

function isAllowedRedirect(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname === 'accounts.google.com') return false;
    return ALLOWED_REDIRECT_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export default async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method Not Allowed' }, 405);
  }

  const sentContentType = req.headers.get('content-type') || 'application/json';

  try {
    const rawBody = await req.text();
    const signal = AbortSignal.timeout(TIMEOUT_MS);

    const firstUrl = new URL(APPS_SCRIPT_URL);
    if (process.env.WEBHOOK_TOKEN) {
      firstUrl.searchParams.set('token', process.env.WEBHOOK_TOKEN);
    }

    let currentUrl = firstUrl.href;
    let currentMethod = 'POST';
    let currentBody = rawBody;
    let redirects = 0;
    let lastRedirectUrl = null;

    while (true) {
      /** @type {Record<string, string>} */
      const headers = {};
      if (currentMethod !== 'GET' && currentBody !== undefined) {
        headers['Content-Type'] = sentContentType;
      }

      const res = await fetch(currentUrl, {
        method: currentMethod,
        headers,
        body: currentMethod === 'GET' ? undefined : currentBody,
        redirect: 'manual',
        signal,
      });

      if (REDIRECT_CODES.has(res.status)) {
        const location = res.headers.get('location');
        const { preview } = await readResponseSafe(res);

        if (!location) {
          throw new UpstreamError(`Apps Script vrátil přesměrování ${res.status} bez hlavičky Location`, {
            status: res.status,
            redirectUrl: lastRedirectUrl,
            redirects,
            preview,
            hint: HINTS.denied,
          });
        }

        const resolvedUrl = new URL(location, currentUrl).href;
        lastRedirectUrl = resolvedUrl;

        if (!isAllowedRedirect(resolvedUrl)) {
          const isLogin = /accounts\.google\.com/i.test(resolvedUrl);
          throw new UpstreamError(
            isLogin
              ? 'Apps Script přesměroval na přihlášení Google (není veřejný přístup)'
              : `Nepovolené přesměrování na doménu: ${resolvedUrl}`,
            {
              status: res.status,
              redirectUrl: resolvedUrl,
              redirects,
              preview,
              hint: isLogin ? HINTS.login : HINTS.denied,
            }
          );
        }

        redirects += 1;
        if (redirects > MAX_REDIRECTS) {
          throw new UpstreamError(`Překročen maximální počet přesměrování (${MAX_REDIRECTS})`, {
            status: res.status,
            redirectUrl: resolvedUrl,
            redirects,
            preview,
          });
        }

        currentUrl = resolvedUrl;
        if (REDIRECT_GET_CODES.has(res.status)) {
          currentMethod = 'GET';
          currentBody = undefined;
        } else if (REDIRECT_PRESERVE_CODES.has(res.status)) {
          // Zachováme metodu i tělo
        }
        continue;
      }

      const { text, preview } = await readResponseSafe(res);
      const ctx = {
        status: res.status,
        redirectUrl: lastRedirectUrl,
        redirects,
        preview,
      };

      if (!res.ok) {
        let hint = null;
        if (res.status === 401) hint = HINTS.login;
        else if (res.status === 403) hint = HINTS.denied;
        else if (res.status === 404) hint = HINTS.notFound;

        throw new UpstreamError(`Apps Script vrátil HTTP ${res.status}`, {
          ...ctx,
          hint,
        });
      }

      if (ACCESS_DENIED_PAGE.test(preview)) {
        throw new UpstreamError('Apps Script vrátil stránku o odepřeném přístupu nebo přihlášení', {
          ...ctx,
          hint: HINTS.denied,
        });
      }

      let parsed = null;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        throw new UpstreamError('Apps Script nevrátil platný JSON', {
          ...ctx,
          hint: HINTS.noJson,
        });
      }

      if (!parsed || typeof parsed !== 'object' || parsed.ok !== true) {
        const errMsg = parsed && parsed.error ? String(parsed.error) : 'Apps Script nevrátil { ok: true }';
        const hint = parsed && parsed.error === 'unauthorized' ? HINTS.unauthorized : HINTS.noJson;

        throw new UpstreamError(errMsg, {
          ...ctx,
          hint,
        });
      }

      const result = {
        ok: true,
        upstreamStatus: res.status,
        redirects,
        redirectUrl: lastRedirectUrl,
        orderId: parsed.orderId,
        duplicate: parsed.duplicate,
        handledForm: parsed.handledForm,
        test: parsed.test,
        version: parsed.version,
        confirmation: parsed.confirmation,
        confirmationReason: parsed.confirmationReason,
        responsePreview: preview.slice(0, PREVIEW_CHARS),
      };

      // Stav potvrzení zákazníkovi je vidět v logu funkce (Netlify → Functions → pohoda-webhook).
      const logLine = JSON.stringify({
        handledForm: result.handledForm,
        orderId: result.orderId,
        duplicate: result.duplicate,
        confirmation: result.confirmation,
        confirmationReason: result.confirmationReason,
        version: result.version,
      });
      if (result.confirmation === 'failed') {
        console.error('pohoda-webhook: potvrzení zákazníkovi SELHALO', logLine);
      } else if (result.confirmation === 'skipped') {
        console.warn('pohoda-webhook: potvrzení zákazníkovi přeskočeno', logLine);
      } else {
        console.log('pohoda-webhook ok', logLine);
      }

      return jsonResponse(result);
    }
  } catch (err) {
    const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    const errorPayload = {
      ok: false,
      error: isTimeout
        ? `Časový limit požadavku vypršel (${TIMEOUT_MS / 1000} s)`
        : String(err?.message || err),
      hint: isTimeout ? HINTS.timeout : err?.hint || null,
      upstreamStatus: err?.status ?? null,
      redirectUrl: err?.redirectUrl ?? null,
      redirects: err?.redirects ?? 0,
      sentContentType,
      responsePreview: String(err?.preview || '').slice(0, PREVIEW_CHARS),
    };

    console.error('pohoda-webhook error:', JSON.stringify(errorPayload));
    return jsonResponse(errorPayload, 500);
  }
};
