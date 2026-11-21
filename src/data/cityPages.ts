/**
 * Texty stránek poboček /dorty-<město>/. Každá stránka má vlastní title, description, H1 a text.
 */
import type { ShopId } from '../lib/seo';

export interface CityPage {
  /** Obsah <title>. */
  title: string;
  h1: string;
  description: string;
  /** Tvar „v Ostravě-Zábřehu“ do vět a otázek. */
  inCity: string;
  intro: string;
  sectionTitle: string;
  paragraphs: string[];
  points: string[];
}

export const CITY_PAGES: Record<ShopId, CityPage> = {
  ostrava: {
    title: 'Dorty a zákusky Ostrava-Zábřeh | Cukrárna Blahutovi, Výškovická',
    h1: 'Cukrárna Blahutovi Ostrava-Zábřeh – dorty a zákusky',
    description:
      'Cukrárna Blahutovi na Výškovické v Ostravě-Zábřehu: čerstvé zákusky, chlebíčky, dorty na zakázku a jedlý tisk. Otevírací doba, telefon a online objednání.',
    inCity: 'v Ostravě-Zábřehu',
    intro:
      'Naše ostravská prodejna je na Výškovické v Zábřehu. Vyzvednete si tu čerstvé zákusky, chlebíčky i objednané dorty z naší výrobny v Píšti.',
    sectionTitle: 'Dorty, zákusky a chlebíčky v Ostravě-Zábřehu',
    paragraphs: [
      'V prodejně v Ostravě-Zábřehu najdete čerstvé zákusky a mini zákusky, obložené chlebíčky a další lahůdkářské výrobky. K tomu si můžete dát kávu nebo domácí limonádu. Provozovna je klimatizovaná.',
      'Dorty a zákusky vyrábíme ve výrobně v Píšti a do prodejen je rozvážíme vlastní chlazenou dopravou. Dort na zakázku, svatební a narozeninové dorty, jedlý tisk i zákusky si můžete objednat online a vyzvednout právě v Ostravě-Zábřehu. Kalendář objednávky nabízí jen dny, kdy je prodejna otevřená.',
    ],
    points: [
      'denně čerstvé zákusky, mini zákusky a obložené chlebíčky',
      'dorty na zakázku: svatební, narozeninové, dětské, ke křtinám, nahé i 3D',
      'jedlý tisk na fondánový list',
      'výdej online objednávek v prodejně v Ostravě-Zábřehu',
    ],
  },
  karvina: {
    title: 'Dorty Karviná – dorty a zákusky na zakázku | Cukrárna Blahutovi',
    h1: 'Dorty a zákusky Karviná – Cukrárna Blahutovi',
    description:
      'Dorty na zakázku v Karviné: svatební, narozeninové a dětské dorty, čerstvé zákusky a jedlý tisk. Cukrárna Blahutovi na tř. Těreškovové, otevírací doba a online objednání.',
    inCity: 'v Karviné',
    intro:
      'Naši prodejnu v Karviné najdete na třídě Těreškovové. Zákusky a objednané dorty si tu vyzvednete v den, který vyberete při objednávce.',
    sectionTitle: 'Dorty a zákusky v Karviné',
    paragraphs: [
      'Karvinská prodejna nabízí čerstvé zákusky a mini zákusky z naší rodinné výroby a další cukrářské výrobky. Objednat si tu můžete také dort na zakázku, ať už narozeninový, dětský, svatební, nebo například ke křtinám.',
      'Dorty, jedlý tisk, zápichy i zákusky objednáte online na webu a při objednávce zvolíte Karvinou jako místo vyzvednutí. Kalendář nabízí jen dny, kdy je prodejna otevřená a kdy stíháme zboží připravit.',
    ],
    points: [
      'čerstvé zákusky a mini zákusky z rodinné výroby',
      'dorty na zakázku pro oslavy v Karviné a okolí',
      'jedlý tisk na fondánový list a zápichy na dorty',
      'výdej online objednávek v prodejně v Karviné',
    ],
  },
  petrvald: {
    title: 'Dorty a zákusky Petřvald | Cukrárna Blahutovi, Šenovská',
    h1: 'Cukrárna Blahutovi Petřvald – dorty a zákusky',
    description:
      'Cukrárna Blahutovi v Petřvaldě na Šenovské: čerstvé zákusky, dorty na zakázku a jedlý tisk. Otevřeno od úterý do neděle, online objednání s vyzvednutím.',
    inCity: 'v Petřvaldě',
    intro:
      'Cukrárnu v Petřvaldě najdete na Šenovské ulici. Máme tu otevřeno od úterý do neděle, takže se zastavíte i o víkendu.',
    sectionTitle: 'Dorty a zákusky v Petřvaldě',
    paragraphs: [
      'V Petřvaldě si můžete koupit čerstvé zákusky a mini zákusky z naší výroby. Nabízíme také dorty na zakázku, například svatební, narozeninové nebo dětské, a jedlý tisk na fondánový list.',
      'Objednávku odešlete online a při objednání zvolte Petřvald jako místo vyzvednutí. Prodejna je otevřená od úterý do neděle, v pondělí je zavřeno. Podle toho se řídí i termíny v kalendáři formuláře.',
    ],
    points: [
      'otevřeno úterý až neděle, v pondělí zavřeno',
      'čerstvé zákusky a mini zákusky',
      'dorty na zakázku a jedlý tisk na fondánový list',
      'výdej online objednávek v prodejně v Petřvaldě',
    ],
  },
  pist: {
    title: 'Dorty a zákusky Píšť, Opavsko | Výrobna Cukrářství Blahutovi',
    h1: 'Cukrářství Blahutovi Píšť – výrobna dortů a zákusků',
    description:
      'Sídlo a výrobna Cukrářství Blahutovi v Píšti u Opavy: dorty na zakázku, zákusky a jedlý tisk. Vyzvednutí objednávek v Píšti, kontakt a otevírací doba.',
    inCity: 'v Píšti',
    intro:
      'V Píšti na Opavsku je naše sídlo a výrobna, odkud dorty a zákusky rozvážíme do prodejen. Objednané zboží si tu můžete vyzvednout také osobně.',
    sectionTitle: 'Výrobna dortů a zákusků v Píšti',
    paragraphs: [
      'V Píšti (okres Opava) vznikají všechny naše dorty, zákusky a další cukrářské výrobky. Odtud je vlastní chlazenou dopravou rozvážíme do prodejen v Ostravě-Zábřehu, Karviné a Petřvaldě a zásobujeme také kavárny, restaurace a firmy v okolí.',
      'Objednaný dort, jedlý tisk nebo zákusky si můžete vyzvednout přímo v Píšti. Při objednání v kalendáři zvolte Píšť jako místo vyzvednutí. Termíny se řídí provozem výroby, víkendové vyzvednutí je možné po domluvě.',
    ],
    points: [
      'sídlo a výrobna na Opavsku, vyzvednutí objednávek po–pá',
      'dorty na zakázku, svatební dorty, jedlý tisk',
      'víkendové vyzvednutí po telefonické domluvě',
      'velkoodběratelé: kavárny, restaurace a firmy (viz Pro firmy)',
    ],
  },
};
