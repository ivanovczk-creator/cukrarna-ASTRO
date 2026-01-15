
export interface Product {
  id: string;
  name: string;
  category: 'cake' | 'pastry';
  description: string;
  price: number;
  image: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  mapUrl: string;
  closedDays: number[]; // 0 = Sun, 1 = Mon, ...
}

export interface SiteData {
  products: Product[];
  stores: Store[];
}
