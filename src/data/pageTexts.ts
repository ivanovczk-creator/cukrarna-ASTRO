/**
 * Úvodní/popisné texty stránek s nabídkou (zákusky, zápichy, studená kuchyně, přehled dortů).
 * Vycházejí z pravidel webu (lhůta objednání +2 dny, osobní odběr, platba při převzetí).
 */

export interface PageText {
  title: string;
  paragraphs: string[];
  points: string[];
}

export const ZAKUSKY_TEXT: PageText = {
  title: 'Zákusky a mini zákusky z rodinné výroby',
  paragraphs: [
    'Zákusky a mini zákusky připravujeme ve výrobně v Píšti u Opavy z poctivých surovin a do našich prodejen v Ostravě-Zábřehu, Karviné a Petřvaldě je rozvážíme vlastní chlazenou dopravou. Každý zákusek si můžete prohlédnout s fotografií a cenou.',
    'Zákusky si objednáte online k vyzvednutí na vybrané prodejně. Objednávejte alespoň 2 dny předem, kalendář ve formuláři nabídne jen dny, kdy je prodejna otevřená. Zaplatit můžete při převzetí hotově nebo kartou. Mini zákusky se hodí na oslavy, svatební sladký stůl i firemní akce.',
  ],
  points: [
    'zákusky i mini zákusky z naší výroby v Píšti',
    'vyzvednutí: Ostrava-Zábřeh, Karviná, Petřvald, Píšť',
    'objednávka alespoň 2 dny předem',
    'informace o alergenech v obchodních podmínkách',
  ],
};

export const ZAPICHY_TEXT: PageText = {
  title: 'Zápichy a ozdoby na dorty',
  paragraphs: [
    'Zápichy jsou drobná dekorace, která dort dotvoří: od narozeninových nápisů a čísel po postavičky z oblíbených pohádek. K dortům vyrábíme také akrylové a dřevěné zápichy se jménem, datem nebo vlastním textem, například ke křtinám, narozeninám nebo svatbě.',
    'Zápichy si vyzvednete společně s objednaným dortem nebo zákuskem na vybrané prodejně. Objednávejte alespoň 2 dny předem. Zápichy vyrobené na zakázku se jménem nebo textem se připravují individuálně, podmínky odstoupení od smlouvy najdete v obchodních podmínkách.',
  ],
  points: [
    'narozeninové zápichy, čísla a postavičky z oblíbených pohádek',
    'akrylové a dřevěné zápichy se jménem a datem na zakázku',
    'vyzvednutí spolu s dortem na prodejně',
  ],
};

export const STUDENA_KUCHYNE_TEXT: PageText = {
  title: 'Chlebíčky a kanapky na oslavy i firemní akce',
  paragraphs: [
    'Vedle dortů a zákusků nabízíme i studenou kuchyni: obložené chlebíčky a kanapky z čerstvých surovin. Hodí se na rodinné oslavy, narozeniny, svatby i firemní setkání a občerstvení pro hosty.',
    'Chlebíčky a kanapky si objednáte online a vyzvednete na vybrané prodejně v Ostravě-Zábřehu, Karviné nebo Petřvaldě, případně v Píšti. Objednávejte alespoň 2 dny předem. Při větším odběru doporučujeme zavolat přímo na vybranou prodejnu.',
  ],
  points: [
    'obložené chlebíčky a kanapky na oslavy i firemní akce',
    'osobní odběr na prodejně, platba při převzetí',
    'objednávka alespoň 2 dny předem',
  ],
};

export const DORTY_TEXT: PageText = {
  title: 'Dorty na zakázku z naší výroby v Píšti',
  paragraphs: [
    'Dorty vyrábíme v rodinném cukrářství Blahutovi z poctivých surovin: pravého másla, smetany, čerstvého ovoce a kvalitní čokolády. Vyberte si kategorii podle příležitosti: svatební, narozeninové, dětské, ke křtinám, elegantní, nahé a polonahé nebo 3D a netradiční tvarované dorty.',
    'Pokud nenajdete dort podle svých představ, pošlete nám předlohu nebo fotografii v konfigurátoru „Dort na přání“. Dorty si vyzvednete na prodejnách v Ostravě-Zábřehu, Karviné a Petřvaldě nebo přímo ve výrobně v Píšti na Opavsku.',
  ],
  points: [
    'dorty z nabídky objednávejte alespoň 2 dny předem, dort na přání 7 dní předem',
    'dorty doplníme jedlým tiskem na fondánový list a zápichy',
    'osobní vyzvednutí na vybrané prodejně',
  ],
};
