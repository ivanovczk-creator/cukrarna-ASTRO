/**
 * Časté dotazy (vykreslují se viditelně na stránkách + jako FAQPage JSON-LD).
 * Odpovědi vycházejí z pravidel webu (lhůty a dny výdeje z lib/pickupRules.ts, platby z /platebni-metody/,
 * alergeny z obchodních podmínek). Před úpravou lhůt nebo plateb je potřeba upravit i tyto odpovědi.
 */
import type { FaqItem } from '../lib/seo';

export const CAKE_FAQ: FaqItem[] = [
  {
    question: 'Jak dlouho předem je potřeba dort objednat?',
    answer:
      'Dorty z nabídky objednávejte alespoň 2 dny předem. U dortu na přání podle vlastní předlohy počítejte s lhůtou 7 dní. Svatební dorty a náročnější 3D dorty doporučujeme domluvit co nejdříve. Kalendář ve formuláři nabízí jen termíny, které stíháme připravit.',
  },
  {
    question: 'Kde si objednaný dort vyzvednu?',
    answer:
      'Dort si vyzvednete osobně na vybrané prodejně v Ostravě-Zábřehu, Karviné nebo Petřvaldě, případně ve výrobně v Píšti u Opavy. Zboží vydáváme pouze osobním odběrem, doručování nenabízíme.',
  },
  {
    question: 'Jak mohu zaplatit?',
    answer:
      'Objednávku můžete zaplatit při převzetí na prodejně hotově nebo platební kartou. Online platba kartou nebo bankovním převodem přes platební bránu Comgate je v košíku označena podle aktuální dostupnosti. Podrobnosti jsou na stránce Platební metody.',
  },
  {
    question: 'Můžete upéct dort podle mé fotografie nebo vlastního nápadu?',
    answer:
      'Ano. Přes konfigurátor „Dort na přání“ nám pošlete předlohu nebo fotografii, ozveme se a vše společně doladíme. Konfigurátor zároveň nabízí jen dny, kdy je volná kapacita a prodejna je otevřená.',
  },
  {
    question: 'Kde najdu informace o alergenech?',
    answer:
      'Přehled 14 hlavních alergenů a informace o skladování a spotřebě najdete v obchodních podmínkách. S dotazy k alergenům u konkrétního dortu nebo zákusku se na nás před objednávkou obraťte telefonicky na vybrané prodejně.',
  },
];

export const PRINT_FAQ: FaqItem[] = [
  {
    question: 'Na co jedlý tisk tisknete?',
    answer:
      'Tiskneme potravinářskými barvami výhradně na fondánový list, nikoli na oplatkový papír. Fondánový list má syté barvy, příjemnou strukturu a dobře drží na dortu.',
  },
  {
    question: 'Jaký obrázek mám poslat?',
    answer:
      'Stačí vlastní fotografie, firemní logo nebo oblíbený motiv ve formátu JPG nebo PNG v dobrém rozlišení. Můžete poslat i fotku dortu, který se vám líbí. Ozveme se vám a vše společně doladíme.',
  },
  {
    question: 'Za jak dlouho bude tisk hotový a kde si ho vyzvednu?',
    answer:
      'Jedlý tisk bývá obvykle hotový do druhého dne. Vyzvednout si ho můžete na vybrané prodejně v Píšti, Ostravě-Zábřehu, Karviné nebo Petřvaldě. Kalendář ve formuláři nabízí jen dostupné dny.',
  },
];

/** Dotazy specifické pro pobočku. */
export function shopFaq(opts: {
  city: string;
  inCity: string;
  address: string;
  hours: string[];
  pickupLabel: string;
  isHeadquarters?: boolean;
}): FaqItem[] {
  const items: FaqItem[] = [
    {
      question: `Kde najdu cukrárnu Blahutovi ${opts.inCity}?`,
      answer: `${opts.isHeadquarters ? 'Sídlo a výrobna' : 'Prodejna'} Cukrářství Blahutovi ${opts.inCity} je na adrese ${opts.address}.`,
    },
    {
      question: `Jaká je otevírací doba ${opts.inCity}?`,
      answer: `${opts.hours.join('; ')}. Objednávky zde vydáváme ${opts.pickupLabel}. O svátcích mohou být hodiny jiné a objednané zboží se na státní svátky nevydává.`,
    },
    {
      question: 'Dá se objednat dort online a vyzvednout tady?',
      answer:
        'Ano. Dort na přání, dorty z nabídky, zákusky, zápichy i jedlý tisk si objednáte online a při objednání zvolíte tuto pobočku jako místo vyzvednutí.',
    },
  ];
  return items;
}
