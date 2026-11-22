import React, { useEffect, useState } from 'react';
import { rememberOrder, trackBeginCheckout } from '../lib/analytics';
import PickupDateInput from './PickupDateInput';
import { getEarliestPickup, getLeadDays, getPickupDateError, getPickupHint } from '../lib/pickupRules';
import PaymentMethodSelector from './PaymentMethodSelector';
import {
  ONLINE_PAYMENTS_ENABLED,
  cartTotal,
  generateOrderId,
  type PaymentMethod,
} from '../lib/payments/config';
import { startOnlinePayment } from '../lib/payments/client';
import ConsentCheckbox from './ConsentCheckbox';
import LegalNotices from './LegalNotices';
import { BINDING_ORDER_LABEL } from '../lib/legal';

/**
 * Obsah rozbaleného košíku (seznam položek + objednávkový formulář).
 * Načítá se líně až při prvním otevření košíku (viz ReservationForm.tsx), aby se při úvodním načtení
 * stránky nestahoval formulář, platby, právní texty ani kontrola výdejních dnů.
 */

export type CartItem = { name: string; price: string; quantity: number; img: string; category?: string };

// Kategorie položky (dorty / zakusky / zapichy / studena-kuchyne); starší položky v localStorage
// bez kategorie poznáme podle cesty k fotce.
const itemCategory = (item: CartItem): string => {
  if (item.category) return item.category;
  const img = item.img || '';
  if (img.includes('/img/dorty/')) return 'dorty';
  if (img.includes('/zakusky/')) return 'zakusky';
  if (img.includes('/zapichy/')) return 'zapichy';
  if (img.includes('/studena-kuchyne/')) return 'studena-kuchyne';
  return 'ostatni';
};

interface Props {
  cart: CartItem[];
  removeItem: (name: string) => void;
}

const CartPanel = ({ cart, removeItem }: Props) => {
  const [selectedStore, setSelectedStore] = useState('Petřvald');
  const [pickupDate, setPickupDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GA4: zákazník otevřel košík s objednávkovým formulářem (panel se montuje až při otevření)
  useEffect(() => {
    trackBeginCheckout(cart.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity, category: itemCategory(item) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obsahuje košík dort? (starší položky v localStorage bez kategorie poznáme podle cesty k fotce)
  const includesCake = cart.some(item => itemCategory(item) === 'dorty');

  // Nejbližší možný termín: nejpřísnější lhůta podle položek v košíku (+2 dny), potom vyřazení blokovaných dnů
  const leadDays = getLeadDays(cart.map(itemCategory));
  const earliest = getEarliestPickup({ store: selectedStore, includesCake, leadDays });
  const dateError = getPickupDateError(pickupDate, selectedStore, includesCake, earliest);
  const dateHint = getPickupHint(selectedStore, includesCake, earliest);

  const total = cartTotal(cart);
  const onlineAvailable = ONLINE_PAYMENTS_ENABLED && total !== null && total > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validace data: výdejní dny prodejny + (jen u košíku s dortem) dny s plnou kapacitou dortů
    const dateProblem = getPickupDateError(String(formData.get('Datum') ?? ''), selectedStore, includesCake, earliest);
    if (dateProblem) {
      return;
    }

    // Úprava seznamu pro e-mail: U zákusků i zápichů vynecháme odkaz na fotku
    const list = cart.map(item => {
      const basicInfo = `${item.quantity}x ${item.name} (${item.price})`;
      const isSimpleItem = itemCategory(item) !== 'dorty';

      return isSimpleItem
        ? basicInfo
        : `${basicInfo}\nOdkaz: ${window.location.origin}${item.img}`;
    }).join('\n\n---\n\n');

    // Platba + strojově čitelná data pro zpracování objednávek (Google Workspace / Apps Script)
    const orderId = generateOrderId();
    const wantsOnline = paymentMethod === 'online' && onlineAvailable;
    const items = cart.map(({ name, price, quantity }) => ({ name, price, quantity }));
    formData.set('Zpusob-Platby', wantsOnline ? 'online' : 'cash');
    formData.append('Cislo-Objednavky', orderId);
    formData.append('Celkem-Kc', total !== null ? String(total) : '');
    // jednotná struktura pro zpracování (Apps Script): kategorie u každé položky + souhrn kategorií
    const categories = cart.map(itemCategory);
    formData.append('Typ-Pozadavku', 'Objednávka z košíku');
    formData.append('Kategorie-Objednavky', Array.from(new Set(categories)).join(','));
    formData.append('Produkty-JSON', JSON.stringify(cart.map(({ name, price, quantity }, i) => ({ name, price, quantity, category: categories[i] }))));
    formData.append('Produkty-Seznam', list);

    setIsSubmitting(true);
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });
      if (!res.ok) throw new Error(`Server vrátil ${res.status}`);
      localStorage.removeItem('blahutovi_cart');
      // GA4: událost purchase se pošle na stránce /dekujeme/ (u online platby až po potvrzení zaplacení)
      rememberOrder({
        orderId,
        value: total ?? 0,
        payment: wantsOnline ? 'online' : 'cash',
        items: cart.map((item, i) => ({ name: item.name, price: item.price, quantity: item.quantity, category: categories[i] })),
      });

      if (wantsOnline) {
        try {
          const redirect = await startOnlinePayment({
            orderId,
            email: String(formData.get('Email') || ''),
            name: String(formData.get('Jmeno') || ''),
            phone: String(formData.get('Telefon') || ''),
            items,
          });
          window.location.href = redirect;
          return;
        } catch (payErr) {
          console.error(payErr);
          alert("Objednávku jsme přijali, ale online platbu se nepodařilo zahájit. Ozveme se vám, nebo zaplatíte při převzetí.");
        }
      }
      window.location.href = "/dekujeme/";
    } catch (err) {
      alert("Chyba při odesílání: " + err);
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return <p className="text-center text-zinc-500 italic py-8 font-bold">Košík je prázdný</p>;
  }

  return (
    <form name="objednavka" method="POST" onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="form-name" value="objednavka" />
      <div className="max-h-48 overflow-y-auto mb-6 space-y-3 pr-2 scrollbar-thin">
        {cart.map((item, i) => (
          <div key={i} className="flex gap-3 items-center bg-zinc-50 p-2 rounded-xl border border-zinc-100">
            <img src={item.img} alt="" className="w-10 h-10 object-cover rounded-lg" loading="lazy" />
            <div className="flex-grow">
              <p className="font-bold text-xs leading-tight">{item.name}</p>
              <p className="text-[10px] text-gold-700 font-black">{item.quantity}x {item.price}</p>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.name)}
              className="text-red-400 hover:text-red-600 p-2 cursor-pointer transition-colors"
              aria-label={`Odebrat ${item.name} z košíku`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-zinc-100">
        <input id="cart-name" type="text" name="Jmeno" autoComplete="name" aria-label="Jméno a příjmení" placeholder="Jméno a příjmení" required className="w-full p-3 bg-zinc-50 rounded-xl text-sm border border-transparent focus:border-gold-500 outline-none font-bold" />
        <div className="grid grid-cols-2 gap-2">
          <input id="cart-email" type="email" name="Email" autoComplete="email" aria-label="E-mail" placeholder="E-mail" required className="w-full p-3 bg-zinc-50 rounded-xl text-sm border border-transparent focus:border-gold-500 outline-none font-bold" />
          <input id="cart-phone" type="tel" name="Telefon" autoComplete="tel" aria-label="Telefon" placeholder="Telefon" required className="w-full p-3 bg-zinc-50 rounded-xl text-sm border border-transparent focus:border-gold-500 outline-none font-bold" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            id="cart-store"
            name="Prodejna"
            aria-label="Místo vyzvednutí (prodejna)"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full p-3 bg-zinc-50 rounded-xl text-sm border border-transparent focus:border-gold-500 outline-none font-bold"
          >
            <option>Petřvald</option>
            <option>Píšť</option>
            <option>Karviná</option>
            <option>Ostrava (Zábřeh)</option>
          </select>
          <PickupDateInput
            id="cart-date"
            name="Datum"
            aria-label="Datum vyzvednutí"
            min={earliest.date}
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            error={dateError}
            aria-describedby="cart-date-hint"
            required
            className="w-full p-3 bg-zinc-50 rounded-xl text-sm border border-transparent focus:border-gold-500 outline-none font-bold"
          />
        </div>
        {/* vysvětlení termínů přes celou šířku košíku (v úzkém sloupci u pole by se špatně četlo) */}
        {dateHint && (
          <p id="cart-date-hint" className="text-[10px] font-bold text-zinc-500 leading-snug">{dateHint}</p>
        )}

        <textarea id="cart-note" name="Poznamka" aria-label="Poznámka k objednávce (nepovinné)" placeholder="Poznámka k objednávce (nepovinné)" className="w-full p-3 bg-zinc-50 rounded-xl text-sm outline-none h-20 resize-none border border-transparent focus:border-gold-500 font-bold"></textarea>

        <PaymentMethodSelector
          value={onlineAvailable ? paymentMethod : 'cash'}
          onChange={setPaymentMethod}
          onlineAvailable={onlineAvailable}
          total={total}
        />

        <LegalNotices variant="cart" />

        <ConsentCheckbox id="cart-consent" compact />

        <button type="submit" disabled={isSubmitting || !!dateError} className="w-full disabled:opacity-60 disabled:cursor-not-allowed bg-gold-500 text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-900 hover:text-gold-500 transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-widest text-[10px]">
          {isSubmitting ? 'Odesílám…' : BINDING_ORDER_LABEL}
        </button>
      </div>
    </form>
  );
};

export default CartPanel;
