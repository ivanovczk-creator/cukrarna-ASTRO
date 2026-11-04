/**
 * Konfigurace online plateb (Comgate) – klientská část.
 *
 * Online platba se zapíná proměnnou prostředí PUBLIC_ONLINE_PAYMENTS=true
 * (Netlify → Site settings → Environment variables). Dokud je vypnutá,
 * objednávkový formulář nabízí jen platbu při převzetí a chová se jako dřív.
 *
 * Tajné údaje (COMGATE_MERCHANT, COMGATE_SECRET…) jsou jen v Netlify Functions,
 * nikdy se nedostanou do prohlížeče. Viz integrations/README.md.
 */

export type PaymentMethod = 'cash' | 'online';

export const ONLINE_PAYMENTS_ENABLED: boolean =
  import.meta.env.PUBLIC_ONLINE_PAYMENTS === 'true';

export const CREATE_PAYMENT_ENDPOINT = '/.netlify/functions/create-payment';

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'cash', label: 'Při převzetí', hint: 'Zaplatíte na prodejně' },
  { id: 'online', label: 'Online kartou', hint: 'Bezpečná platba přes Comgate' },
];

export interface CartLine {
  name: string;
  price: string | number;
  quantity: number;
}

/** "1900 Kč" / "1 900 Kč" / 1900 -> 1900. Texty typu "od 1900 Kč" vrací null. */
export function parsePrice(price: string | number): number | null {
  if (typeof price === 'number') return Number.isFinite(price) ? price : null;
  const match = String(price).replace(/\s/g, '').match(/^(\d+(?:[.,]\d+)?)/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

/** Součet košíku v Kč, nebo null když některou cenu nelze spočítat. */
export function cartTotal(cart: CartLine[]): number | null {
  let total = 0;
  for (const item of cart) {
    const unit = parsePrice(item.price);
    if (unit === null) return null;
    total += unit * item.quantity;
  }
  return total;
}

export function formatCzk(amount: number): string {
  return `${new Intl.NumberFormat('cs-CZ').format(amount)} Kč`;
}

/** Číslo objednávky např. BL-20261104-7K3F (používá se jako refId u Comgate i číslo v POHODĚ). */
export function generateOrderId(now: Date = new Date()): string {
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `BL-${ymd}-${rand}`;
}
