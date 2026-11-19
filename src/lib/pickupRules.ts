import { CAKE_CAPACITY_MESSAGE, isBlockedDate } from './blockedDates';
import { HOLIDAYS_BLOCK_PICKUP, HOLIDAY_MESSAGE, isPublicHoliday } from './holidays';

/**
 * Pravidla pro výběr data vyzvednutí objednávky.
 *  1) Minimální lhůta podle sortimentu (dorty, zákusky, chlebíčky, zápichy +2 dny; u více druhů zboží
 *     platí nejpřísnější = nejpozdější termín). Jedlý tisk je obvykle hotový do druhého dne (lhůta 1 den),
 *     ale vyzvednout ho lze jen v dny uvedené v PRINT_PICKUP_DAYS (interní provozní pravidlo).
 *  2) Pravidelné výdejní dny vybrané prodejny – platí pro každou objednávku.
 *  3) Státní svátky – prodejny objednávky nevydávají (lze vypnout v holidays.ts).
 *  4) Dny s plnou kapacitou dortů (kalendář „Blokovaná data“ v CMS) – platí jen, pokud
 *     objednávka obsahuje dort (katalogový dort v košíku nebo dort na přání).
 *
 * Nejdřív se spočítá nejbližší datum podle lhůty, potom se z dostupných dnů vyřadí blokované dny.
 * Blokovaný den se do lhůty nezapočítává jako „pracovní“ – lhůta se počítá v kalendářních dnech
 * a nejbližším možným termínem je první neblokovaný den od data podle lhůty.
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
export { CAKE_CAPACITY_MESSAGE, HOLIDAY_MESSAGE };

// ---------------------------------------------------------------------------------------------
// Minimální lhůty
// ---------------------------------------------------------------------------------------------

/** Základní lhůta u zboží z nabídky (dorty, zákusky, chlebíčky / studená kuchyně, zápichy): +2 dny. */
export const BASE_LEAD_DAYS = 2;
/** Jedlý tisk: obvykle hotový do druhého dne → termín se počítá od následujícího dne (bez navyšování lhůty). */
export const PRINT_LEAD_DAYS = 1;
/** Dny, na které lze jedlý tisk vyzvednout (JS getDay: úterý–sobota), i když je prodejna jinak otevřená. Interní pravidlo – zákazníkovi se nezobrazuje. */
export const PRINT_PICKUP_DAYS: readonly number[] = [2, 3, 4, 5, 6];
export const PRINT_DAY_MESSAGE =
  'Na zvolený den není vyzvednutí jedlého tisku k dispozici. Vyberte prosím jiný den z nabídky v kalendáři.';
/** Dort na přání (poptávka): zachovaná stávající lhůta 7 dní. */
export const CUSTOM_CAKE_LEAD_DAYS = 7;

/** Lhůty podle kategorie položky v košíku (dorty / zakusky / zapichy / studena-kuchyne / ostatni). */
export const LEAD_DAYS_BY_CATEGORY: Record<string, number> = {
  dorty: BASE_LEAD_DAYS,
  zakusky: BASE_LEAD_DAYS,
  zapichy: BASE_LEAD_DAYS,
  'studena-kuchyne': BASE_LEAD_DAYS,
  ostatni: BASE_LEAD_DAYS,
};

export interface LeadOptions {
  /** objednávka je jedlý tisk (lhůta 1 den, vyzvednutí jen v dny z PRINT_PICKUP_DAYS) */
  print?: boolean;
  /** dort na přání (poptávka) */
  customCake?: boolean;
}

/** Nejpřísnější (nejdelší) lhůta ze všech kategorií v objednávce. */
export function getLeadDays(categories: readonly string[] = [], options: LeadOptions = {}): number {
  let days = options.customCake ? CUSTOM_CAKE_LEAD_DAYS : 0;
  if (options.print) days = Math.max(days, PRINT_LEAD_DAYS);
  for (const category of categories) {
    days = Math.max(days, LEAD_DAYS_BY_CATEGORY[category] ?? BASE_LEAD_DAYS);
  }
  return days === 0 ? BASE_LEAD_DAYS : days;
}

// ---------------------------------------------------------------------------------------------
// Datumy (YYYY-MM-DD, bez vlivu časového pásma prohlížeče – „dnes“ se bere v Europe/Prague)
// ---------------------------------------------------------------------------------------------

/** Dnešní datum v českém čase ve formátu YYYY-MM-DD. */
export function todayInPrague(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addDaysIso(isoDate: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return isoDate;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return dt.toISOString().slice(0, 10);
}

/** „1 den“, „2 dny“, „7 dní“ */
function daysLabel(n: number): string {
  return `${n} ${n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní'}`;
}

const WEEKDAY_NAMES = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];

/** „středa 21. 10. 2026“ */
export function formatPickupDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return isoDate;
  const weekday = weekdayOf(isoDate);
  return `${weekday === null ? '' : WEEKDAY_NAMES[weekday] + ' '}${Number(m[3])}. ${Number(m[2])}. ${m[1]}`;
}

/** Den v týdnu z řetězce YYYY-MM-DD bez vlivu časového pásma. */
export function weekdayOf(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
}

// ---------------------------------------------------------------------------------------------
// Blokované dny a nejbližší možný termín
// ---------------------------------------------------------------------------------------------

/** Důvod, proč den nelze zvolit (zavřená prodejna, svátek, plná kapacita dortů), nebo null. */
export function getBlockedReason(
  isoDate: string,
  storeValue: string,
  includesCake: boolean,
  options: LeadOptions = {},
): string | null {
  const store = toStoreKey(storeValue);
  const weekday = weekdayOf(isoDate);
  if (store && weekday !== null && !STORE_PICKUP_DAYS[store].includes(weekday)) {
    return CLOSED_DAY_MESSAGE;
  }

  if (options.print && weekday !== null && !PRINT_PICKUP_DAYS.includes(weekday)) {
    return PRINT_DAY_MESSAGE;
  }

  if (HOLIDAYS_BLOCK_PICKUP && isPublicHoliday(isoDate)) {
    return HOLIDAY_MESSAGE;
  }

  if (includesCake && isBlockedDate(isoDate)) {
    return CAKE_CAPACITY_MESSAGE;
  }

  return null;
}

export interface EarliestPickup {
  /** lhůta v dnech od objednání */
  leadDays: number;
  /** nejbližší datum čistě podle lhůty (ještě bez vyřazení blokovaných dnů) */
  minByLead: string;
  /** nejbližší možný termín = první neblokovaný den od minByLead */
  date: string;
  /** kolik blokovaných dnů se přeskočilo mezi minByLead a date */
  skippedDays: number;
}

/** 1) datum podle lhůty, 2) vyřazení blokovaných dnů → nejbližší možný termín. */
export function getEarliestPickup(options: {
  store: string;
  includesCake: boolean;
  leadDays: number;
  today?: string;
  /** jedlý tisk – navíc se vyřadí dny mimo PRINT_PICKUP_DAYS */
  print?: boolean;
}): EarliestPickup {
  const today = options.today ?? todayInPrague();
  const minByLead = addDaysIso(today, options.leadDays);
  const leadOptions: LeadOptions = { print: options.print };

  let date = minByLead;
  let skippedDays = 0;
  while (skippedDays < 400 && getBlockedReason(date, options.store, options.includesCake, leadOptions)) {
    date = addDaysIso(date, 1);
    skippedDays += 1;
  }

  return { leadDays: options.leadDays, minByLead, date, skippedDays };
}

export function getTooEarlyMessage(earliest: EarliestPickup): string {
  return `Tento termín je dříve, než stihneme zboží připravit. Nejbližší možný termín je ${formatPickupDate(earliest.date)}.`;
}

/**
 * Chyba vybraného dne (null = v pořádku). Nejdřív se kontroluje minimální lhůta, potom blokované dny.
 * `earliest` je výsledek getEarliestPickup – bez něj se kontrolují jen blokované dny.
 */
export function getPickupDateError(
  isoDate: string,
  storeValue: string,
  includesCake: boolean,
  earliest?: EarliestPickup,
  options: LeadOptions = {},
): string | null {
  if (!isoDate) return null;

  if (earliest && isoDate < earliest.minByLead) {
    return getTooEarlyMessage(earliest);
  }

  return getBlockedReason(isoDate, storeValue, includesCake, options);
}

/** Stručné vysvětlení pod kalendářem: nejbližší termín a proč jsou některé dny neaktivní. */
export function getPickupHint(
  storeValue: string,
  includesCake: boolean,
  earliest?: EarliestPickup,
  options: LeadOptions = {},
): string | undefined {
  const store = toStoreKey(storeValue);
  const parts: string[] = [];

  if (earliest) {
    if (options.print) {
      parts.push(
        `Nejbližší možný termín vyzvednutí na prodejně: ${formatPickupDate(earliest.date)}. Jedlý tisk bývá obvykle hotový do druhého dne.`,
      );
    } else {
      parts.push(
        `Nejbližší možný termín: ${formatPickupDate(earliest.date)} (lhůta ${daysLabel(earliest.leadDays)} od objednání).`,
      );
    }
  }

  if (options.print) {
    // Jedlý tisk: obecná formulace – interní provozní dny se zákazníkovi nevypisují.
    parts.push('V kalendáři jsou k výběru jen dny dostupné pro vyzvednutí na prodejně. Dřívější a nedostupné dny nelze zvolit.');
    return parts.join(' ');
  }

  if (store) parts.push(`Výdej v této prodejně: ${STORE_PICKUP_LABEL[store]}.`);

  const blocked = ['dřívější dny', 'dny, kdy je prodejna zavřená'];
  if (HOLIDAYS_BLOCK_PICKUP) blocked.push('státní svátky');
  if (includesCake) blocked.push('dny s plnou kapacitou dortů');
  parts.push(`Nelze zvolit: ${blocked.join(', ')}.`);

  return parts.join(' ');
}
