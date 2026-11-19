/**
 * Lehká část klientské logiky nahrávání souborů (limity a kontrola výběru) – načítá se hned s formuláři.
 * Samotné nahrávání a zmenšování obrázků je v printUpload.ts a načítá se až při výběru souboru / odeslání.
 * Pravidla musí odpovídat netlify/lib/print-files.mjs (server je ověřuje znovu).
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'];

export const SHRINKABLE = ['jpg', 'jpeg', 'png', 'webp'];

export const getExtension = (name: string): string => /\.([a-z0-9]+)$/i.exec(name)?.[1].toLowerCase() ?? '';

export const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

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
