/**
 * SEO a strukturovaná data (schema.org JSON-LD) – jediný zdroj údajů o provozovnách.
 * Používá se na stránce /prodejny/, ve stránkách měst (/dorty-<město>/), v patičce a v JSON-LD.
 */
import { COMPANY, SOCIAL_LINKS } from './legal';
import { STORE_PICKUP_LABEL } from './pickupRules';

export const SITE_ORIGIN = 'https://cukrarstviblahutovi.cz';
export const SITE_NAME = 'Cukrářství Blahutovi';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/img/dorty/51.webp`;

export type ShopId = 'ostrava' | 'karvina' | 'petrvald' | 'pist';
type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Shop {
  id: ShopId;
  /** Část adresy stránky: /dorty-<slug>/ */
  slug: string;
  city: string;
  /** Název provozovny (zobrazuje se na /prodejny/ a ve schema.org). */
  name: string;
  /** Název shodný s Google Business Profile (schema.org `name`). */
  gbpName: string;
  /** Provozovna je sídlo a výroba (ne běžná prodejna). */
  isHeadquarters?: boolean;
  streetAddress: string;
  postalCode: string;
  /** Městská část / obec v adrese. */
  locality: string;
  phone: string;
  /** Hodiny pro zobrazení na webu. */
  hours: string[];
  /** Strukturované hodiny pro schema.org (vynecháno = neuvádí se). */
  openingHours?: { days: DayName[]; opens: string; closes: string }[];
  mapUrl: string;
  /** Dny výdeje objednávek (shodně s kalendářem ve formulářích). */
  pickupLabel: string;
}

export const SHOPS: Shop[] = [
  {
    id: 'pist',
    slug: 'pist',
    city: 'Píšť',
    name: 'Sídlo firmy & Výroba',
    gbpName: 'Cukrářská výroba - Cukrářství Blahutovi',
    isHeadquarters: true,
    streetAddress: 'Opavská 218/101',
    postalCode: '747 18',
    locality: 'Píšť',
    phone: '+420 602 323 788',
    hours: ['Po–Pá: 6:00 – 15:00', 'So–Ne: Dle domluvy'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cukrarstvi+Blahutovi+Pist',
    pickupLabel: STORE_PICKUP_LABEL.pist,
  },
  {
    id: 'petrvald',
    slug: 'petrvald',
    city: 'Petřvald',
    name: 'Cukrárna Petřvald',
    gbpName: 'Cukrářství Blahutovi - Cukrárna Petřvald',
    streetAddress: 'Šenovská 1',
    postalCode: '735 41',
    locality: 'Petřvald',
    phone: '+420 778 157 857',
    hours: ['Út–Ne: 9:00 – 17:00', 'Po: Zavřeno'],
    openingHours: [
      { days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '09:00', closes: '17:00' },
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cukrarna+Blahutovi+Petrvald',
    pickupLabel: STORE_PICKUP_LABEL.petrvald,
  },
  {
    id: 'karvina',
    slug: 'karvina',
    city: 'Karviná',
    name: 'Cukrárna Karviná',
    gbpName: 'Cukrářství Blahutovi - Cukrárna Karviná',
    streetAddress: 'tř. Těreškovové 2233/28',
    postalCode: '734 01',
    locality: 'Karviná',
    phone: '+420 778 157 867',
    hours: ['Po–Pá: 9:00 – 17:00', 'So: 8:00 – 12:00', 'Ne: Zavřeno'],
    openingHours: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' },
      { days: ['Saturday'], opens: '08:00', closes: '12:00' },
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cukrarna+Blahutovi+Karvina',
    pickupLabel: STORE_PICKUP_LABEL.karvina,
  },
  {
    id: 'ostrava',
    slug: 'ostrava',
    city: 'Ostrava',
    name: 'Cukrárna Ostrava Zábřeh',
    gbpName: 'Cukrářství Blahutovi - Cukrárna Ostrava Zábřeh',
    streetAddress: 'Výškovická 116a',
    postalCode: '700 30',
    locality: 'Ostrava-jih',
    phone: '+420 775 271 101',
    hours: ['Po–Pá: 9:00 – 17:00', 'So: 9:00 – 12:00', 'Ne: Zavřeno'],
    openingHours: [
      { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' },
      { days: ['Saturday'], opens: '09:00', closes: '12:00' },
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Cukrarna+Blahutovi+Ostrava',
    pickupLabel: STORE_PICKUP_LABEL.ostrava,
  },
];

export const shopAddress = (shop: Shop) => `${shop.streetAddress}, ${shop.postalCode} ${shop.locality}`;
export const shopUrl = (shop: Shop) => `${SITE_ORIGIN}/dorty-${shop.slug}/`;
export const shopPath = (shop: Shop) => `/dorty-${shop.slug}/`;
export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;

// ---------------------------------------------------------------------------------------------
// schema.org uzly
// ---------------------------------------------------------------------------------------------

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const shopId = (shop: Shop) => `${shopUrl(shop)}#bakery`;

/** Odkazy na další profily firmy (jen vyplněné). */
export function sameAsLinks(shopIdValue?: ShopId): string[] {
  const links = [SOCIAL_LINKS.facebook, SOCIAL_LINKS.instagram, SOCIAL_LINKS.firmy, SOCIAL_LINKS.mapy];
  if (shopIdValue) links.push(SOCIAL_LINKS.googleBusinessProfile[shopIdValue] ?? '');
  else links.push(...Object.values(SOCIAL_LINKS.googleBusinessProfile));
  return links.filter(Boolean);
}

const hqShop = SHOPS.find((s) => s.isHeadquarters)!;

export function organizationNode() {
  const sameAs = sameAsLinks();
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: COMPANY.tradeName,
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/favicon.png`,
    image: DEFAULT_OG_IMAGE,
    description:
      'Rodinné cukrářství z Píště u Opavy: dorty na zakázku, zákusky, jedlý tisk na fondánový list a studená kuchyně. Prodejny v Ostravě-Zábřehu, Karviné a Petřvaldě.',
    foundingDate: '1991',
    founder: { '@type': 'Person', name: COMPANY.person },
    email: COMPANY.email,
    telephone: COMPANY.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hqShop.streetAddress,
      postalCode: hqShop.postalCode,
      addressLocality: hqShop.locality,
      addressCountry: 'CZ',
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: SITE_NAME,
    inLanguage: 'cs-CZ',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** Prodejna (Bakery). Sídlo a výroba v Píšti se uvádí jen jako adresa Organization, ne jako prodejna s hodinami. */
export function shopNode(shop: Shop) {
  const sameAs = sameAsLinks(shop.id);
  return {
    '@type': ['Bakery', 'LocalBusiness'],
    '@id': shopId(shop),
    name: shop.gbpName,
    url: shopUrl(shop),
    image: DEFAULT_OG_IMAGE,
    telephone: shop.phone,
    email: COMPANY.email,
    parentOrganization: { '@id': ORGANIZATION_ID },
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.streetAddress,
      postalCode: shop.postalCode,
      addressLocality: shop.locality,
      addressCountry: 'CZ',
    },
    ...(shop.openingHours
      ? {
          openingHoursSpecification: shop.openingHours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    servesCuisine: 'Cukrářské výrobky',
    currenciesAccepted: 'CZK',
    paymentAccepted: 'Hotově, platební karta',
    hasMap: shop.mapUrl,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Prodejny pro schema.org (bez sídla/výroby v Píšti). */
export const RETAIL_SHOPS = SHOPS.filter((s) => !s.isHeadquarters);

export function breadcrumbNode(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${item.path}`,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqNode(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
