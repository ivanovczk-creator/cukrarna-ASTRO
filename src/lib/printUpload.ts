/**
 * Klientská logika nahrávání souborů k jedlému tisku.
 * Pravidla musí odpovídat netlify/lib/print-files.mjs (server je ověřuje znovu).
 */

export const UPLOAD_ENDPOINT = '/api/upload-print';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'];

// A4 při 300 dpi = 3508 px na delší straně
const MAX_IMAGE_SIDE = 3508;
const SHRINKABLE = ['jpg', 'jpeg', 'png', 'webp'];

export const getExtension = (name: string): string => /\.([a-z0-9]+)$/i.exec(name)?.[1].toLowerCase() ?? '';

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

/** Vrátí českou chybovou hlášku, nebo null když je výběr v pořádku. */
export function validateSelection(files: File[]): string | null {
  if (files.length === 0) return 'Vyberte alespoň jeden soubor.';
  if (files.length > MAX_FILES) return `Maximálně ${MAX_FILES} souborů najednou.`;

  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
      return `Soubor „${file.name}“ má nepodporovaný typ. Povolené: JPG, PNG, WEBP, HEIC, PDF.`;
    }
    if (file.size === 0) return `Soubor „${file.name}“ je prázdný.`;
    const canShrink = SHRINKABLE.includes(getExtension(file.name));
    if (file.size > MAX_FILE_BYTES && !canShrink) {
      return `Soubor „${file.name}“ má ${mb(file.size)} (limit ${mb(MAX_FILE_BYTES)}). Pošlete ho prosím e-mailem.`;
    }
  }
  return null;
}

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
