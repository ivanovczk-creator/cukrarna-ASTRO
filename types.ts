export interface Dort {
  id: string;
  title: string;
  cena: string | number;
  porce: string;
  foto: string;
  kategorie: 'dorty';
  weight?: number;
}

export interface Zakusek {
  id: string;
  title: string;
  cena: string | number;
  foto: string;
  kategorie: 'zakusky';
  popis?: string;
  weight?: number;
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
  Petrvald = 'Petřvald (Šenovská 1)',
  Karvina = 'Karviná (Tř. Těreškovové 2233/28)',
  Ostrava = 'Ostrava Zábřeh (Výškovická 116A)',
  Pist = 'Výrobna Píšť (Opavská 218/101)'
}