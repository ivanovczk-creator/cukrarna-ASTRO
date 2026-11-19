import { CAKE_CAPACITY_MESSAGE, isBlockedDate } from './blockedDates';

/**
 * Pravidla pro výběr data vyzvednutí objednávky.
 *  1) Pravidelné výdejní dny vybrané prodejny – platí pro každou objednávku.
 *  2) Dny s plnou kapacitou dortů (kalendář „Blokovaná data“ v CMS) – platí jen, pokud
 *     objednávka obsahuje dort (katalogový dort v košíku nebo dort na přání).
 */

export type StoreKey = 'pist' | 'petrvald' | 'karvina' | 'ostrava';

/** Povolené dny v týdnu (JS getDay: 0 = neděle … 6 = sobota). */
export const STORE_PICKUP_DAYS: Record<StoreKey, readonly number[]> = {
  pist: [1, 2, 3, 4, 5], // Po–Pá (So/Ne jen po telefonické domluvě)
  petrvald: [2, 3, 4, 5, 6, 0], // Út–Ne (pondělí zavřeno)
  karvina: [2, 3, 4, 5, 6], // Út–So
  ostrava: [1, 2, 3, 4, 5, 6], // Po–So
};

export const STORE_PICKUP_LABEL: Record<StoreKey, string> = {
  pist: 'Po–Pá',
  petrvald: 'Út–Ne',
  karvina: 'Út–So',
  ostrava: 'Po–So',
};

/** Hodnoty polí „Prodejna“ ve formulářích → interní klíč. */
const STORE_KEY_BY_VALUE: Record<string, StoreKey> = {
  // košík a jedlý tisk
  'Petřvald': 'petrvald',
  'Píšť': 'pist',
  'Karviná': 'karvina',
  'Ostrava (Zábřeh)': 'ostrava',
  // dort na přání
  petrvald: 'petrvald',
  pist: 'pist',
  karvina: 'karvina',
  ostrava: 'ostrava',
};

export function toStoreKey(value: string): StoreKey | null {
  return STORE_KEY_BY_VALUE[value] ?? null;
}

export const CLOSED_DAY_MESSAGE = 'Na zvolený den tato prodejna objednávky nevydává. Vyberte prosím jiný den.';
export { CAKE_CAPACITY_MESSAGE };

/** Den v týdnu z řetězce YYYY-MM-DD bez vlivu časového pásma. */
export function weekdayOf(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
}

export function getPickupDateError(isoDate: string, storeValue: string, includesCake: boolean): string | null {
  if (!isoDate) return null;

  const store = toStoreKey(storeValue);
  const weekday = weekdayOf(isoDate);
  if (store && weekday !== null && !STORE_PICKUP_DAYS[store].includes(weekday)) {
    return CLOSED_DAY_MESSAGE;
  }

  if (includesCake && isBlockedDate(isoDate)) {
    return CAKE_CAPACITY_MESSAGE;
  }

  return null;
}

export function getPickupHint(storeValue: string, includesCake: boolean): string | undefined {
  const store = toStoreKey(storeValue);
  const parts: string[] = [];
  if (store) parts.push(`Výdej v této prodejně: ${STORE_PICKUP_LABEL[store]}.`);
  if (includesCake) parts.push('Dny s plnou kapacitou dortů nelze zvolit.');
  return parts.length ? parts.join(' ') : undefined;
}
