/**
 * POST /.netlify/functions/pohoda-webhook
 * Webhook z Netlify Forms (Site configuration → Notifications → Form submission notifications →
 * Outgoing webhook). Surové tělo požadavku se beze změny přepošle do Google Apps Script
 * (zpracování objednávek / export pro POHODU).
 *
 * - jiná metoda než POST → 405
 * - chyba při přeposlání (síť, Apps Script vrátí chybu) → 500 + JSON { ok: false, error }
 */
const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwbbUYAH_qt6DVzzH35d4WLWFyCCyyNuLGiVZnm73UaKUT_Si1L28NfEkbv_b0DISvJ/exec';

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  try {
    const rawBody = await req.text();

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': req.headers.get('content-type') || 'application/json' },
      body: rawBody,
      redirect: 'follow',
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new Error(`Apps Script vrátil HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
    }

    return json({ ok: true, status: res.status });
  } catch (err) {
    console.error('pohoda-webhook:', err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
};
