// Sdílená pravidla pro soubory k jedlému tisku (používá upload i stahování).
export const PRINT_STORE = 'print-uploads';
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // limit těla požadavku u Netlify Functions je 6 MB

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'];

export const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
};

export function getExtension(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(filename || '');
  return m ? m[1].toLowerCase() : '';
}

/** Bezpečný název souboru do URL: bez diakritiky, mezer a speciálních znaků. */
export function safeFileName(filename) {
  const ext = getExtension(filename);
  const base = String(filename || 'soubor')
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'soubor'}.${ext}`;
}

/** Ověří obsah souboru podle prvních bajtů (přípona se dá snadno podvrhnout). */
export function matchesSignature(ext, bytes) {
  const startsWith = (...sig) => sig.every((b, i) => bytes[i] === b);
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return startsWith(0xff, 0xd8, 0xff);
    case 'png':
      return startsWith(0x89, 0x50, 0x4e, 0x47);
    case 'pdf':
      return startsWith(0x25, 0x50, 0x44, 0x46); // %PDF
    case 'webp':
      return startsWith(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45; // RIFF....WE
    case 'heic':
    case 'heif':
      return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70; // "ftyp"
    default:
      return false;
  }
}
