/**
 * České státní svátky (zákon č. 245/2000 Sb.) – pevné dny + Velký pátek a Velikonoční pondělí.
 * Použití: pickupRules.ts je bere jako dny, na které prodejny objednávky nevydávají.
 */

/**
 * Přepínač: true = na státní svátky nelze vyzvednout (v kalendáři jsou neaktivní).
 * Pokud některá prodejna na svátky otevřeno má, nastavte false (nebo svátek přidejte do výjimek v CMS).
 */
export const HOLIDAYS_BLOCK_PICKUP = true;

export const HOLIDAY_MESSAGE = 'Ve státní svátek prodejny objednávky nevydávají. Vyberte prosím jiný den.';

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Velikonoční neděle (Meeus/Jones/Butcher) – vrací [měsíc, den]. */
function easterSunday(year: number): [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

const cache = new Map<number, Set<string>>();

/** Množina svátků daného roku ve formátu YYYY-MM-DD. */
export function holidaysOf(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const [em, ed] = easterSunday(year);
  const easter = Date.UTC(year, em - 1, ed);
  const shift = (days: number) => {
    const dt = new Date(easter + days * 86400000);
    return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  };

  const set = new Set<string>([
    iso(year, 1, 1), // Nový rok / Den obnovy samostatného českého státu
    shift(-2), // Velký pátek
    shift(1), // Velikonoční pondělí
    iso(year, 5, 1), // Svátek práce
    iso(year, 5, 8), // Den vítězství
    iso(year, 7, 5), // Cyril a Metoděj
    iso(year, 7, 6), // Jan Hus
    iso(year, 9, 28), // Den české státnosti
    iso(year, 10, 28), // Vznik Československa
    iso(year, 11, 17), // Den boje za svobodu a demokracii
    iso(year, 12, 24), // Štědrý den
    iso(year, 12, 25), // 1. svátek vánoční
    iso(year, 12, 26), // 2. svátek vánoční
  ]);
  cache.set(year, set);
  return set;
}

/** Je den (YYYY-MM-DD) státním svátkem? */
export function isPublicHoliday(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4));
  return Number.isInteger(year) && holidaysOf(year).has(isoDate);
}
