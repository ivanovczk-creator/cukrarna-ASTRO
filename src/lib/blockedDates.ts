import blockedDatesFile from '../data/blocked-dates.json';

// Soubor spravuje Decap CMS (Blokovaná data → Kalendář plné kapacity dortů).
// Formát: { "dates": [ { "date": "YYYY-MM-DD" }, ... ] }
type BlockedDatesFile = {
  dates?: Array<{ date?: string } | string>;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const CAKE_CAPACITY_MESSAGE =
  'Na tento termín máme již naplněnou kapacitu výroby dortů. Zvolte prosím pozdější datum (zákusky a ostatní sortiment lze na tento den objednat samostatně).';

export function getBlockedDates(): string[] {
  const entries = (blockedDatesFile as BlockedDatesFile).dates ?? [];

  return entries
    .map((entry) => String(typeof entry === 'string' ? entry : entry?.date ?? '').slice(0, 10))
    .filter((date) => DATE_PATTERN.test(date));
}

const blockedDateSet = new Set(getBlockedDates());

/** Je den zablokovaný pro dorty (plná kapacita výroby)? */
export function isBlockedDate(value: string): boolean {
  return blockedDateSet.has(value);
}
