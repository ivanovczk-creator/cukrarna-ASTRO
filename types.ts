
export interface Cake {
  id: string;
  name: string;
  pricePerServing: number;
  availablePortions: number[];
  imageId: string;
  description: string;
}

export interface Dessert {
  id: string;
  name: string;
  price: number;
  imageId: string;
  description: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  portions?: number; // Only for cakes
  type: 'cake' | 'dessert';
}

export enum Branch {
  Petrvald = 'Petřvald',
  Karvina = 'Karviná',
  Ostrava = 'Ostrava'
}
