/**
 * Jediný zdroj pravdy pro právní a identifikační údaje provozovatele.
 * Používá se v patičce, právních stránkách (Astro) i v košíku / formulářích (React).
 */

export const COMPANY = {
  tradeName: 'Ivo Blahut – Cukrářství Blahutovi',
  shortName: 'Cukrářství Blahutovi',
  person: 'Ivo Blahut',
  ico: '76208371',
  vatStatus: 'Plátce DPH',
  /** DIČ (CZ + 10 číslic) – zobrazuje se ve VOP; prázdný řetězec = nezobrazí se. */
  dic: '',
  legalForm:
    'fyzická osoba podnikající dle živnostenského zákona, zapsaná v živnostenském rejstříku',
  street: 'Opavská 218/101',
  zipCity: '747 18 Píšť',
  address: 'Opavská 218/101, 747 18 Píšť',
  phone: '+420 602 323 788',
  email: 'objednavky@cukrarstviblahutovi.cz',
  web: 'https://cukrarstviblahutovi.cz',
} as const;

export const STORES = [
  {
    id: 'ostrava',
    name: 'Cukrárna Ostrava-Zábřeh',
    address: 'Výškovická 116a, 700 30 Ostrava-jih',
    phone: '+420 775 271 101',
  },
  {
    id: 'karvina',
    name: 'Cukrárna Karviná',
    address: 'tř. Těreškovové 2233/28, 734 01 Karviná-Ráj',
    phone: '+420 778 157 867',
  },
  {
    id: 'petrvald',
    name: 'Cukrárna Petřvald',
    address: 'Šenovská 1, 735 41 Petřvald',
    phone: '+420 778 157 857',
  },
] as const;

export const COMGATE = {
  name: 'Comgate, a.s.',
  gatewayUrl: 'https://www.comgate.cz/cz/platebni-brana',
  address: 'Gočárova třída 1754 / 48b, Hradec Králové',
  email: 'platby-podpora@comgate.cz',
  phone: '+420 228 224 267',
} as const;

export const COI = {
  name: 'Česká obchodní inspekce',
  address: 'Štěpánská 567/15, 120 00 Praha 2',
  web: 'www.coi.cz',
  url: 'https://www.coi.cz',
} as const;

export const LEGAL_PAGES = {
  terms: '/obchodni-podminky',
  privacy: '/ochrana-osobnich-udaju',
  payments: '/platebni-metody',
  cookies: '/zasady-cookies',
} as const;

export const NAV_LINKS = [
  { href: '/dorty', label: 'Dorty' },
  { href: '/zakusky', label: 'Zákusky' },
  { href: '/studena-kuchyne', label: 'Studená kuchyně' },
  { href: '/zapichy', label: 'Zápichy' },
  { href: '/jedly-tisk', label: 'Jedlý tisk' },
  { href: '/dort-na-prani', label: 'Dort na přání' },
  { href: '/prodejny', label: 'Prodejny' },
  { href: '/pro-firmy', label: 'Pro firmy' },
] as const;

/** Povinné alergeny dle přílohy II nařízení (EU) č. 1169/2011 (1–14). */
export const ALLERGENS = [
  { n: 1, name: 'Obiloviny obsahující lepek', note: 'pšenice, žito, ječmen, oves, špalda, kamut' },
  { n: 2, name: 'Korýši', note: '' },
  { n: 3, name: 'Vejce', note: '' },
  { n: 4, name: 'Ryby', note: '' },
  { n: 5, name: 'Arašídy', note: '' },
  { n: 6, name: 'Sója', note: '' },
  { n: 7, name: 'Mléko', note: 'včetně laktózy' },
  {
    n: 8,
    name: 'Skořápkové plody',
    note: 'mandle, lískové, vlašské, kešu, pekanové, para ořechy, pistácie, makadamové ořechy',
  },
  { n: 9, name: 'Celer', note: '' },
  { n: 10, name: 'Hořčice', note: '' },
  { n: 11, name: 'Sezamová semena', note: '' },
  { n: 12, name: 'Oxid siřičitý a siřičitany', note: 'při koncentraci vyšší než 10 mg/kg nebo 10 mg/l' },
  { n: 13, name: 'Vlčí bob (lupina)', note: '' },
  { n: 14, name: 'Měkkýši', note: '' },
] as const;

export const ALLERGEN_CROSS_CONTAMINATION =
  'Naše výrobky se vyrábějí v provozu, kde se zpracovávají všechny výše uvedené alergeny, proto nelze vyloučit jejich stopy ani u výrobků, které je ve složení neobsahují. Informace o alergenech u konkrétního výrobku vám sdělíme na prodejně nebo e-mailem na ' +
  COMPANY.email +
  '.';

export const PERISHABLE_NOTICE =
  'Čerstvé zákusky, dorty a chlebíčky jsou určeny k okamžité spotřebě a vyžadují skladování v chladu do 8 °C.';

export const WITHDRAWAL_NOTICE =
  'Zboží podléhající rychlé zkáze (čerstvé zákusky, dorty, chlebíčky, kanapky) a zboží upravené podle přání spotřebitele (zakázkové dorty, jedlý tisk, zápichy na míru) je dle § 1837 písm. d) a e) občanského zákoníku vyloučeno z odstoupení od smlouvy do 14 dnů. U nepersonalizovaných zápichů lze od smlouvy odstoupit do 14 dnů od převzetí.';

/** Text povinného (předem nezaškrtnutého) souhlasu v košíku a formulářích. */
export const CONSENT_LABEL_PARTS = {
  before: 'Souhlasím se ',
  terms: 'Všeobecnými obchodními podmínkami',
  middle: ' a beru na vědomí ',
  privacy: 'Zásady ochrany osobních údajů',
  after: '.',
} as const;

/** Povinné označení tlačítka objednávky dle § 1826 odst. 2 občanského zákoníku. */
export const BINDING_ORDER_LABEL = 'Objednávka zavazující k platbě';

/** Klíč v localStorage pro volbu cookies. */
export const COOKIE_CONSENT_KEY = 'blahutovi_cookie_consent';
