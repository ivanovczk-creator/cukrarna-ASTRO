
export interface Dort {
  id: string;
  nazev: string;
  cena_za_porci: number;
  mozne_porce: number[];
  foto: string;
  kategorie: 'dorty';
  popis?: string;
}

export interface Zakusek {
  id: string;
  nazev: string;
  cena: number;
  foto: string;
  kategorie: 'zakusky';
  popis?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  portions?: number;
  type: 'cake' | 'dessert';
}

export enum Branch {
  Petrvald = 'Petřvald',
  Karvina = 'Karviná',
  Ostrava = 'Ostrava'
}
