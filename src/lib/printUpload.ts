/**
 * Klientská logika nahrávání souborů (jedlý tisk, inspirační obrázek dortu na přání).
 * Těžší část (zmenšení obrázku, upload) – formuláře ji načítají dynamicky až při výběru souboru / odeslání.
 * Limity a kontrola výběru jsou v printLimits.ts (server je ověřuje znovu).
 */
import { MAX_FILE_BYTES, SHRINKABLE, getExtension, mb } from './printLimits';

export { ALLOWED_EXTENSIONS, MAX_FILES, MAX_FILE_BYTES, getExtension, validateSelection } from './printLimits';

export const UPLOAD_ENDPOINT = '/api/upload-print';

// A4 při 300 dpi = 3508 px na delší straně
const MAX_IMAGE_SIDE = 3508;

/** Příliš velký rastrový obrázek zmenší na A4 @300 dpi (JPEG); ostatní vrátí beze změny. */
async function prepareFile(file: File): Promise<File> {
  if (file.size <= MAX_FILE_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Obrázek se nepodařilo zmenšit.');
  ctx.fillStyle = '#ffffff'; // průhlednost PNG/WEBP by se jinak v JPEG změnila na černou
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  for (const quality of [0.92, 0.85, 0.75]) {
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_FILE_BYTES) {
      return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.jpg', { type: 'image/jpeg' });
    }
  }
  throw new Error(`Soubor „${file.name}“ je příliš velký i po zmenšení (limit ${mb(MAX_FILE_BYTES)}).`);
}

/** Nahraje jeden soubor a vrátí ABSOLUTNÍ veřejný odkaz ke stažení. */
async function uploadOne(file: File): Promise<string> {
  const prepared = await prepareFile(file);
  const body = new FormData();
  body.append('file', prepared);

  let res: Response;
  try {
    res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body });
  } catch {
    throw new Error('Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu.');
  }

  if (res.status === 404) {
    // typicky lokální `astro dev` / `astro preview` bez Netlify Functions
    throw new Error('Nahrávání souborů je dostupné jen na nasazeném webu (nebo přes `netlify dev`).');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.path) {
    throw new Error(data.error || `Nahrání souboru „${file.name}“ se nezdařilo (${res.status}).`);
  }
  return `${window.location.origin}${data.path}`;
}

/** Nahraje všechny soubory postupně (kvůli limitu těla požadavku 6 MB). */
export async function uploadPrintFiles(files: File[]): Promise<string[]> {
  const links: string[] = [];
  for (const file of files) links.push(await uploadOne(file));
  return links;
}
