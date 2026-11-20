/**
 * Comgate REST API v2.0 – sdílená serverová logika (jen Netlify Functions, nikdy ne prohlížeč).
 *
 * ENV (Netlify → Site configuration → Environment variables, scope Functions):
 *   COMGATE_MERCHANT_ID   ID obchodu v Comgate (524485). Starší název COMGATE_MERCHANT se stále čte.
 *   COMGATE_SECRET        heslo pro komunikaci na pozadí (Připojení obchodů → propojení 524485). TAJNÉ.
 *   COMGATE_TEST          "false" = ostré platby; cokoli jiného (výchozí) = testovací platby
 *   SITE_URL              (volitelné) veřejná adresa webu, výchozí https://cukrarstviblahutovi.cz
 *
 * Tento soubor neobsahuje žádné tajné údaje. COMGATE_SECRET se čte jen z process.env na serveru.
 */

export const DEFAULT_MERCHANT_ID = '524485';
export const DEFAULT_SITE_URL = 'https://cukrarstviblahutovi.cz';
export const COMGATE_API = 'https://payments.comgate.cz/v2.0';

/** Číslo objednávky, které generuje web (src/lib/payments/config.ts → generateOrderId). */
export const ORDER_ID_RE = /^BL-\d{8}-[A-Z0-9]{4}$/;

export const FINAL_STATUSES = ['PAID', 'CANCELLED'];

export function getConfig(env = process.env) {
  return {
    merchant: String(env.COMGATE_MERCHANT_ID || env.COMGATE_MERCHANT || DEFAULT_MERCHANT_ID).trim(),
    secret: String(env.COMGATE_SECRET || '').trim(),
    test: env.COMGATE_TEST !== 'false',
    siteUrl: String(env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, ''),
  };
}

export const isConfigured = (cfg) => Boolean(cfg.merchant && cfg.secret);

/** Porovnání řetězců v konstantním čase (heslo z push notifikace). */
export function safeEqual(a, b) {
  const x = String(a ?? '');
  const y = String(b ?? '');
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i += 1) diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diff === 0;
}

const authHeader = (cfg) => `Basic ${Buffer.from(`${cfg.merchant}:${cfg.secret}`).toString('base64')}`;

/** Návratové URL zákazníka (Comgate za ${id} a ${refId} doplní transakci a číslo objednávky). */
export function buildReturnUrls(cfg) {
  const base = `${cfg.siteUrl}/dekujeme/?refId=\${refId}&platba=`;
  return {
    url_paid: `${base}zaplaceno`,
    url_cancelled: `${base}zrusena`,
    url_pending: `${base}cekajici`,
  };
}

/** Adresa pro push notifikaci (nastavuje se v Comgate Klientském portálu). */
export const pushUrl = (cfg) => `${cfg.siteUrl}/api/comgate-notify`;

/**
 * Založí platbu (POST /v2.0/payment.json).
 * @returns {Promise<{ transId: string, redirect: string }>}
 */
export async function createPayment(cfg, { orderId, amount, email, name }, fetchImpl = fetch) {
  const body = {
    test: cfg.test,
    price: amount, // v haléřích
    curr: 'CZK',
    label: orderId.slice(0, 16),
    refId: orderId,
    method: 'ALL',
    email,
    fullName: String(name ?? '').slice(0, 100),
    name: `Objednavka ${orderId}`,
    country: 'CZ',
    lang: 'cs',
    delivery: 'PICKUP',
    category: 'PHYSICAL_GOODS_ONLY',
    ...buildReturnUrls(cfg),
  };

  const res = await fetchImpl(`${COMGATE_API}/payment.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader(cfg),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });

  const data = await res.json().catch(() => ({}));
  const redirect = data.redirect ?? data.redirectUrl;
  if (!res.ok || Number(data.code) !== 0 || !redirect || !data.transId) {
    const err = new Error(`Comgate create selhalo (HTTP ${res.status}, code ${data.code}): ${data.message ?? ''}`);
    err.comgateCode = data.code;
    throw err;
  }
  return { transId: String(data.transId), redirect: String(redirect) };
}

/** Skutečný stav platby přímo z Comgate (GET /v2.0/payment/transId/{transId}.json). */
export async function fetchPaymentStatus(cfg, transId, fetchImpl = fetch, timeoutMs = 4000) {
  const res = await fetchImpl(`${COMGATE_API}/payment/transId/${encodeURIComponent(transId)}.json`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: authHeader(cfg) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || Number(data.code) !== 0) {
    throw new Error(`Comgate status selhalo (HTTP ${res.status}, code ${data.code}): ${data.message ?? ''}`);
  }
  return data;
}

export function normalizeStatus(value) {
  const s = String(value ?? '').toUpperCase();
  return ['PAID', 'CANCELLED', 'PENDING', 'AUTHORIZED'].includes(s) ? s : null;
}

/**
 * Ověří, že stav z Comgate patří k naší objednávce a že sedí částka i měna (ochrana proti podvržení).
 * @returns {string|null} důvod chyby, nebo null když je vše v pořádku
 */
export function checkCanonical(record, canonical, { pushedRefId, pushedTransId } = {}) {
  if (!record) return 'objednávka není v evidenci plateb';
  if (String(canonical.refId ?? '') !== record.orderId) return 'refId z Comgate neodpovídá objednávce';
  if (pushedRefId !== undefined && String(pushedRefId) !== record.orderId) return 'refId z notifikace neodpovídá objednávce';
  const canonicalTrans = String(canonical.transId ?? pushedTransId ?? '');
  if (pushedTransId !== undefined && canonicalTrans && canonicalTrans !== String(pushedTransId)) {
    return 'transId z notifikace neodpovídá stavu v Comgate';
  }
  if (canonicalTrans && !(record.transIds ?? []).includes(canonicalTrans)) return 'neznámá transakce k objednávce';
  if (String(canonical.price ?? '') !== String(record.amount)) return 'částka z Comgate neodpovídá objednávce';
  if (String(canonical.curr ?? 'CZK').toUpperCase() !== record.curr) return 'měna z Comgate neodpovídá objednávce';
  if (canonical.test !== undefined && String(canonical.test) !== String(record.test)) {
    return 'testovací / ostrý režim neodpovídá objednávce';
  }
  if (!normalizeStatus(canonical.status)) return `neznámý stav platby: ${canonical.status}`;
  return null;
}

/**
 * Přechod stavu platby. PAID je konečný (pozdější CANCELLED ho nepřepíše), CANCELLED lze ještě přepsat na PAID.
 * @returns {{ record: object, changed: boolean }}
 */
export function applyStatus(record, newStatus, transId, now = new Date()) {
  const next = { ...record };
  let changed = false;

  if (transId && !(next.transIds ?? []).includes(transId)) {
    next.transIds = [...(next.transIds ?? []), transId];
    changed = true;
  }

  if (record.status === 'PAID' || newStatus === record.status || newStatus === 'PENDING') {
    if (changed) next.updatedAt = now.toISOString();
    return { record: next, changed };
  }

  next.status = newStatus;
  next.updatedAt = now.toISOString();
  if (newStatus === 'PAID') {
    next.paidAt = now.toISOString();
    next.paidTransId = transId ?? next.transId ?? null;
  }
  // nový stav je potřeba znovu propsat do Apps Scriptu / Pohody
  next.syncedStatus = null;
  return { record: next, changed: true };
}

/** Co smí vidět prohlížeč (stránka /dekujeme) – žádné osobní údaje. */
export function publicStatus(record) {
  if (!record) return 'UNKNOWN';
  if (record.status === 'PAID') return 'PAID';
  if (record.status === 'CANCELLED' || record.status === 'CREATE_FAILED') return 'CANCELLED';
  return 'PENDING';
}

/** Tělo push notifikace: application/x-www-form-urlencoded nebo JSON. */
export async function readParams(req) {
  const raw = await req.text();
  const type = (req.headers.get('content-type') || '').toLowerCase();
  if (type.includes('json') || /^\s*[{[]/.test(raw)) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}
