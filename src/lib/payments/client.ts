import { CREATE_PAYMENT_ENDPOINT, type CartLine } from './config';

export interface StartPaymentInput {
  orderId: string;
  email: string;
  name: string;
  phone?: string;
  items: CartLine[];
}

/**
 * Požádá serverless funkci o založení platby u Comgate.
 * Funkce si cenu přepočítá z data.json (cena z prohlížeče se nepoužije)
 * a vrátí URL platební brány, na kterou zákazníka přesměrujeme.
 */
export async function startOnlinePayment(input: StartPaymentInput): Promise<string> {
  const res = await fetch(CREATE_PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirect) {
    throw new Error(data.error || `Platbu se nepodařilo zahájit (${res.status})`);
  }
  return data.redirect as string;
}
