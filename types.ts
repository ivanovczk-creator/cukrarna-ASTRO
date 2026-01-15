export interface Dort {
  id: string;
  title: string;
  cena: string | number;
  porce: string;
  foto: string;
  kategorie: 'dorty';
}

export interface Zakusek {
  id: string;
  title: string;
  cena: string | number;
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