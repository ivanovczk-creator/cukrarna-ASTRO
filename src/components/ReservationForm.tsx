import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { CartItem } from './CartPanel';
import { trackAddToCart } from '../lib/analytics';

/**
 * Tlačítko košíku (ikona + počet položek) a správa obsahu košíku.
 * Samotný objednávkový formulář (CartPanel) se načítá líně až při prvním otevření košíku –
 * úvodní načtení stránky tak nestahuje formulář, platby, právní texty ani pravidla výdejních dnů.
 */

const loadCartPanel = () => import('./CartPanel');
const CartPanel = lazy(loadCartPanel);

type CartWindow = Window & { __cartQueue?: unknown[]; __cartShells?: number };

const ReservationForm = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const w = window as CartWindow;

    // Načtení košíku z localStorage
    const saved = localStorage.getItem('blahutovi_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Chyba při parsování košíku");
      }
    }

    const addItem = (detail: any) => {
      const { name, price, img, quantity, category } = detail;
      const q = parseInt(quantity) || 1;
      trackAddToCart({ name, price, quantity: q, category });

      setCart(prev => {
        const existing = prev.find(item => item.name === name);
        let newCart;
        if (existing) {
          newCart = prev.map(item => item.name === name ? {...item, quantity: item.quantity + q} : item);
        } else {
          newCart = [...prev, { name, price, quantity: q, img, category }];
        }
        localStorage.setItem('blahutovi_cart', JSON.stringify(newCart));
        return newCart;
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
    };

    // Ostrov se hydratuje až ve volné chvíli (client:idle / client:visible). Kliknutí na „Do košíku“,
    // které přišlo dřív, zachytila fronta z Layout.astro – tady ji zpracujeme a převezmeme živé události.
    w.__cartShells = (w.__cartShells || 0) + 1;
    const pending = w.__cartQueue || [];
    w.__cartQueue = [];
    pending.forEach(addItem);

    const handleAddToCart = (e: any) => addItem(e.detail);
    window.addEventListener('add-to-cart', handleAddToCart);
    return () => {
      window.removeEventListener('add-to-cart', handleAddToCart);
      w.__cartShells = Math.max(0, (w.__cartShells || 1) - 1);
    };
  }, []);

  const removeItem = (name: string) => {
    const newCart = cart.filter(item => item.name !== name);
    setCart(newCart);
    localStorage.setItem('blahutovi_cart', JSON.stringify(newCart));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        // formulář dopředu stáhneme už při najetí / dotyku / zaostření, ať první otevření není znatelně pomalé
        onPointerEnter={loadCartPanel}
        onFocus={loadCartPanel}
        onTouchStart={loadCartPanel}
        aria-label={`Nákupní košík, počet položek: ${totalItems}`}
        className={`p-2 text-[#d4af37] transition-all cursor-pointer outline-none hover:opacity-80 ${justAdded ? 'scale-125' : 'scale-100'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-[#0a192f]">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 md:w-96 max-h-[80vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 border border-slate-100 text-[#0a192f] z-[100]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-serif italic">Vaše objednávka</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 cursor-pointer p-2 hover:text-navy-900 transition-colors"
              aria-label="Zavřít košík"
            >
              ✕
            </button>
          </div>

          <Suspense fallback={<p className="text-center text-slate-500 italic py-8 font-bold" role="status">Načítám košík…</p>}>
            <CartPanel cart={cart} removeItem={removeItem} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
