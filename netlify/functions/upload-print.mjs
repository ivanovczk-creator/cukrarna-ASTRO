/**
 * POST /api/upload-print   (multipart/form-data, pole "file")
 * Uloží soubor k jedlému tisku do Netlify Blobs a vrátí veřejnou cestu ke stažení:
 *   { path: "/tisk-soubory/<id>/<nazev>.jpg", name, size }
 *
 * Odkaz vede na naši vlastní doménu (funkce print-file), takže se dá z e-mailu rovnou kliknout
 * a stáhnout – na rozdíl od příloh Netlify Forms, které jsou za přihlášením (CloudFront).
 */
import { getStore } from '@netlify/blobs';
import {
  ALLOWED_EXTENSIONS,
  CONTENT_TYPES,
  MAX_FILE_BYTES,
  PRINT_STORE,
  getExtension,
  matchesSignature,
  safeFileName,
} from '../lib/print-files.mjs';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let file;
  try {
    file = (await req.formData()).get('file');
  } catch {
    return json({ error: 'Neplatný požadavek' }, 400);
  }
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return json({ error: 'Chybí soubor' }, 400);
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return json({ error: 'Nepodporovaný typ souboru (JPG, PNG, WEBP, HEIC, PDF)' }, 415);
  }
  if (file.size === 0) return json({ error: 'Soubor je prázdný' }, 400);
  if (file.size > MAX_FILE_BYTES) {
    return json({ error: `Soubor je větší než ${MAX_FILE_BYTES / 1024 / 1024} MB` }, 413);
  }

  const buffer = await file.arrayBuffer();
  if (!matchesSignature(ext, new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)))) {
    return json({ error: 'Obsah souboru neodpovídá jeho příponě' }, 415);
  }

  const id = crypto.randomUUID();
  const name = safeFileName(file.name);

  await getStore(PRINT_STORE).set(`${id}/${name}`, buffer, {
    metadata: { originalName: file.name, contentType: CONTENT_TYPES[ext], uploadedAt: new Date().toISOString() },
  });

  return json({ path: `/tisk-soubory/${id}/${name}`, name: file.name, size: file.size });
};

export const config = {
  path: '/api/upload-print',
  // ochrana proti zahlcení úložiště
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
