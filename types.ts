
export interface Dort {
  id: string;
  nazev: string;
  cena: number;
  porce: string;
  foto: string;
  kategorie: 'dorty';
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
  portions?: string;
  type: 'cake' | 'dessert';
}

export enum Branch {
  Petrvald = 'Petřvald',
  Karvina = 'Karviná',
  Ostrava = 'Ostrava'
}
