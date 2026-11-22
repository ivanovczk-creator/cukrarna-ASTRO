import { parsePrice } from './payments/config';

/**
 * Události e-shopu pro Google Analytics 4 (add_to_cart, begin_checkout, purchase).
 * Měří se jen po souhlasu s analytickými cookies: funkci window.gtag vytvoří CookieBanner.astro až po souhlasu.
 * Bez souhlasu (nebo s blokátorem) jsou všechny funkce tady neškodné a nic se neodesílá.
 */

export type TrackedItem = { name: string; price: string | number; quantity: number; category?: string };

type GaItem = { item_id: string; item_name: string; item_category?: string; price: number; quantity: number };

const ORDER_KEY = 'blahutovi_last_order';

/** Položka ve formátu GA4 (cena v Kč za kus; neznámou cenu bereme jako 0). */
export function toGaItem(item: TrackedItem): GaItem {
  return {
    item_id: item.name,
    item_name: item.name,
    ...(item.category ? { item_category: item.category } : {}),
    price: parsePrice(item.price) ?? 0,
    quantity: item.quantity,
  };
}

export function itemsValue(items: TrackedItem[]): number {
  return items.reduce((sum, item) => sum + (parsePrice(item.price) ?? 0) * item.quantity, 0);
}

/**
 * Odešle událost do GA4. Pokud gtag ještě neexistuje (CookieBanner se inicializuje souběžně), zkusí to
 * několik sekund znovu; bez souhlasu s cookies gtag nevznikne a událost se tiše zahodí.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  const send = () => {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return false;
    gtag('event', name, params);
    return true;
  };
  if (send()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (send() || tries >= 15) clearInterval(timer);
  }, 200);
}

export function trackAddToCart(item: TrackedItem): void {
  trackEvent('add_to_cart', {
    currency: 'CZK',
    value: itemsValue([item]),
    items: [toGaItem(item)],
  });
}

export function trackBeginCheckout(items: TrackedItem[]): void {
  if (!items.length) return;
  trackEvent('begin_checkout', {
    currency: 'CZK',
    value: itemsValue(items),
    items: items.map(toGaItem),
  });
}

export type PendingOrder = {
  orderId: string;
  value: number;
  payment: 'cash' | 'online';
  items: TrackedItem[];
};

/** Zapamatuje odeslanou objednávku; událost purchase se pošle až na stránce /dekujeme/ (po přesměrování). */
export function rememberOrder(order: PendingOrder): void {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    /* sessionStorage nedostupné – purchase se prostě nepošle */
  }
}

/** Přečte a hned smaže zapamatovanou objednávku (aby se purchase při obnovení stránky nepočítal dvakrát). */
export function takeOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(ORDER_KEY);
    const order = JSON.parse(raw);
    return order && typeof order.orderId === 'string' && Array.isArray(order.items) ? (order as PendingOrder) : null;
  } catch {
    return null;
  }
}

export function trackPurchase(order: PendingOrder): void {
  trackEvent('purchase', {
    transaction_id: order.orderId,
    currency: 'CZK',
    value: order.value,
    payment_type: order.payment,
    items: order.items.map(toGaItem),
  });
}
