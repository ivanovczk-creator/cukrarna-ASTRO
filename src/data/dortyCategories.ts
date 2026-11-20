/**
 * SEO obsah kategorií dortů (/dorty/<id>/).
 * Každá kategorie má vlastní <title>, meta description, H1 a vlastní text – stránky se nesmí lišit jen galerií.
 * Odrážky (`points`) a odstavce (`body`) se vykreslují pod nabídkou na stránce kategorie.
 */

export interface CakeCategory {
  id: string;
  /** Obsah <title> (celý, včetně značky). */
  title: string;
  /** Hlavní nadpis stránky. */
  h1: string;
  /** Obsah <meta name="description"> – také úvodní odstavec pod H1. */
  description: string;
  /** Nadpis textové sekce pod nabídkou. */
  sectionTitle: string;
  /** Odstavce textu. */
  body: string[];
  /** Přehledné odrážky. */
  points: string[];
}

export const CAKE_CATEGORIES: CakeCategory[] = [
  {
    id: 'svatebni',
    title: 'Svatební dorty na míru | Ostrava, Karviná, Opavsko | Cukrářství Blahutovi',
    h1: 'Svatební dorty na míru',
    description:
      'Vícepatrové i jednopatrové svatební dorty na zakázku z pravého másla, smetany a čerstvého ovoce. Cukrářství Blahutovi – Píšť, Ostrava-Zábřeh, Karviná, Petřvald.',
    sectionTitle: 'Svatební dorty z poctivých surovin',
    body: [
      'Vyrábíme vícepatrové i jednopatrové svatební dorty na zakázku z poctivých surovin – pravého másla, smetany, čerstvého ovoce, tvarohu i kvalitní čokolády. Rádi sladíme vzhled dortu se stylem vaší svatby, od moderních polonahých dortů s živými květy až po klasické potahované či hladké krémové varianty.',
      'Ke svatebnímu dortu doplníme svatební minizákusky a sweet bar, aby si na sladkém stole přišli na své všichni hosté. Svatební dorty připravujeme s osobním vyzvednutím na našich prodejnách v Ostravě-Zábřehu, Karviné, Petřvaldě i přímo ve výrobně v Píšti (okres Opava).',
    ],
    points: [
      'jedno- i vícepatrové dorty podle počtu hostů',
      'polonahé dorty s živými květy, potahované i hladké krémové dorty',
      'svatební minizákusky a sweet bar jako doplněk k dortu',
      'osobní vyzvednutí: Ostrava-Zábřeh, Karviná, Petřvald, Píšť (okres Opava)',
    ],
  },
  {
    id: 'krtiny',
    title: 'Dorty ke křtinám a narození miminka | Ostrava, Karviná, Píšť | Cukrářství Blahutovi',
    h1: 'Dorty ke křtinám a narození miminka',
    description:
      'Jemné slavnostní dorty ke křtinám, vítání občánků a prvním narozeninám v pastelových odstínech, se jménem a datem. Vyzvednutí v Ostravě, Karviné, Petřvaldě a Píšti.',
    sectionTitle: 'Dort pro oslavu narození a křtin',
    body: [
      'Jemné slavnostní dorty ke křtinám, vítání občánků nebo prvním narozeninám vyrábíme v pastelových i přírodních odstínech. Zdobíme je jedlým tiskem, čerstvým ovocem, čokoládovými prvky nebo vlastními akrylovými či dřevěnými zápichy se jménem a datem.',
      'Korpus i lehký krém přizpůsobíme rodinné oslavě tak, aby chutnal dospělým i dětem. Dort si můžete vyzvednout na kterékoliv naší pobočce v Ostravě, Karviné, Petřvaldě nebo v Píšti.',
    ],
    points: [
      'pastelové i přírodní barevné provedení',
      'jedlý tisk, čerstvé ovoce, čokoládové prvky',
      'akrylové a dřevěné zápichy se jménem a datem',
      'lehký krém, který chutná dětem i dospělým',
    ],
  },
  {
    id: '3d-netradicni',
    title: '3D a netradiční dorty na přání | Ostrava, Karviná, Opavsko | Cukrářství Blahutovi',
    h1: '3D a netradiční tvarované dorty na přání',
    description:
      'Dorty ve tvaru auta, fotbalového míče, postavičky nebo kabelky. Ručně modelované 3D dorty na zakázku podle vaší předlohy – Píšť, Ostrava-Zábřeh, Karviná, Petřvald.',
    sectionTitle: 'Dort ve tvaru, jaký si přejete',
    body: [
      'Hledáte dort ve tvaru auta, fotbalového míče, oblíbené postavičky, kabelky nebo netradičního tematického motivu pro oslavence? Ručně modelované a 3D tvarované dorty připravujeme na zakázku podle vaší předlohy nebo fotografie, včetně vlastních ozdob a zápichů na míru.',
      'Vzhledem k náročnější ruční výrobě doporučujeme objednávat netradiční dorty s dostatečným předstihem. Vyzvednout si je můžete v Píšti, Ostravě-Zábřehu, Karviné nebo Petřvaldě.',
    ],
    points: [
      'dorty ve tvaru aut, míčů, postaviček, kabelek a dalších motivů',
      'výroba podle vaší předlohy nebo fotografie',
      'vlastní ozdoby a zápichy na míru',
      'objednávejte s dostatečným předstihem – jde o náročnou ruční práci',
    ],
  },
  {
    id: 'nahe',
    title: 'Nahé a polonahé dorty s ovocem a květy | Ostrava, Karviná | Cukrářství Blahutovi',
    h1: 'Nahé a polonahé dorty s ovocem a květy',
    description:
      'Nahé (naked) a polonahé dorty s čerstvým sezónním ovocem, jedlými květy a dripem. Lehký krém bez těžké hmoty – Ostrava-Zábřeh, Karviná, Petřvald, Píšť.',
    sectionTitle: 'Nahé dorty bez těžké potahovací hmoty',
    body: [
      'Nahé (naked) a polonahé dorty nechávají vyniknout poctivé vrstvy nadýchaného piškotového nebo kakaového korpusu a jemného krému bez těžké potahovací hmoty. Zdobíme je bohatou vrstvou čerstvého sezónního ovoce, jedlými květy, makronkami nebo jemným čokoládovým přelivem (drip).',
      'Skvěle se hodí na narozeniny, zahradní oslavy i moderní svatby. Objednat je můžete s vyzvednutím v Ostravě-Zábřehu, Karviné, Petřvaldě i v Píšti.',
    ],
    points: [
      'piškotový nebo kakaový korpus a jemný krém',
      'čerstvé sezónní ovoce, jedlé květy, makronky',
      'čokoládový drip jako volitelná ozdoba',
      'vhodné na narozeniny, zahradní oslavy i moderní svatby',
    ],
  },
  {
    id: 'detske',
    title: 'Dětské narozeninové dorty Ostrava a Karviná | Cukrářství Blahutovi',
    h1: 'Dětské narozeninové dorty',
    description:
      'Ručně modelované dětské dorty pro oslavy v Ostravě a Karviné. Postavičky z pohádek i zvířátka z poctivých surovin od Cukrářství Blahutovi.',
    sectionTitle: 'Dort, z kterého budou mít děti radost',
    body: [
      'Dětské dorty vyrábíme ručně z poctivých surovin podle oblíbené pohádky, postavičky nebo zvířátka vašeho oslavence. Motiv, barvy i příchuť domluvíme tak, aby dort chutnal dětem i jejich rodičům.',
      'Dort si vyzvednete na našich prodejnách v Ostravě-Zábřehu, Karviné, Petřvaldě nebo ve výrobně v Píšti. Pokud hledáte něco zcela netradičního, podívejte se také na naše 3D dorty.',
    ],
    points: [
      'oblíbené postavičky, pohádky a zvířátka',
      'dort zdobený jedlým tiskem nebo zápichem se jménem',
      'chuť přizpůsobená dětem',
    ],
  },
  {
    id: 'narozeninove',
    title: 'Narozeninové dorty na zakázku Karviná a Ostrava | Cukrářství Blahutovi',
    h1: 'Narozeninové dorty na zakázku',
    description:
      'Hledáte poctivý narozeninový dort v Karviné nebo Ostravě? Pečeme moderní i klasické dorty na přání. Vyzvednutí na prodejnách Karviná-Ráj a Ostrava-Zábřeh.',
    sectionTitle: 'Narozeninový dort podle vašeho přání',
    body: [
      'Narozeninové dorty připravujeme z poctivých surovin – másla, smetany, čerstvého ovoce a kvalitní čokolády. Vybrat si můžete z hotových vzorů, nebo nám pošlete vlastní nápad či fotografii a dort společně doladíme.',
      'Objednaný dort si vyzvednete na našich prodejnách v Ostravě-Zábřehu, Karviné, Petřvaldě nebo ve výrobně v Píšti.',
    ],
    points: [
      'moderní i klasické dorty pro dospělé i děti',
      'výroba podle vaší představy nebo fotografie',
      'osobní vyzvednutí na prodejně',
    ],
  },
  {
    id: 'elegantni',
    title: 'Elegantní dorty pro jubilea a firemní akce Ostrava | Cukrářství Blahutovi',
    h1: 'Elegantní dorty pro jubilea a slavnostní příležitosti',
    description:
      'Reprezentativní dorty pro významná životní jubilea a firemní akce v Ostravě a Karviné. Precizní design a prvotřídní chuť od Cukrářství Blahutovi.',
    sectionTitle: 'Dorty pro slavnostní chvíle',
    body: [
      'Elegantní dorty vyrábíme pro významná životní jubilea, firemní oslavy a slavnostní příležitosti. Důraz klademe na čistý design, jemné dekorace a poctivé suroviny.',
      'Barvy, výzdobu i příchuť přizpůsobíme akci. Dort si můžete vyzvednout v Ostravě-Zábřehu, Karviné, Petřvaldě nebo v Píšti.',
    ],
    points: [
      'jubilea, firemní oslavy a slavnostní události',
      'jemné dekorace a čisté linie',
      'možnost doplnit dort zákusky nebo studenou kuchyní',
    ],
  },
];
