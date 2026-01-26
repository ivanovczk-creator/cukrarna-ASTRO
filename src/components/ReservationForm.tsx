import React, { useState, useEffect } from 'react';

const ReservationForm = () => {
  const [cart, setCart] = useState<{name: string, price: string, quantity: number}[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleAddToCart = (e: any) => {
      const { name, price } = e.detail;
      setCart(prev => {
        const existing = prev.find(item => item.name === name);
        if (existing) {
          return prev.map(item => item.name === name ? {...item, quantity: item.quantity + 1} : item);
        }
        return [...prev, { name, price, quantity: 1 }];
      });
      setIsOpen(true);
    };

    window.addEventListener('add-to-cart', handleAddToCart);
    return () => window.removeEventListener('add-to-cart', handleAddToCart);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative">
      {/* Ikona košíku */}
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-[#d4af37] hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
            {totalItems}
          </span>
        )}
      </button>

      {/* Vysouvací panel košíku */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-[#0a192f] z-[100]">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Vaše objednávka</h3>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-sm italic">Košík je prázdný</p>
          ) : (
            <form name="objednavka" method="POST" data-netlify="true" action="/dekujeme">
              <input type="hidden" name="form-name" value="objednavka" />
              <div className="max-h-60 overflow-y-auto mb-4">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm mb-2 border-b border-slate-50 pb-1">
                    <input type="hidden" name={`Produkt-${i}`} value={`${item.name} (${item.quantity}x)`} />
                    <span className="font-medium">{item.quantity}x {item.name}</span>
                    <span className="text-[#d4af37]">{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <input type="text" name="Jmeno" placeholder="Vaše jméno" required className="w-full p-2 border rounded-xl text-sm" />
                <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-2 border rounded-xl text-sm" />
                <select name="Prodejna" className="w-full p-2 border rounded-xl text-sm">
                  <option>Petřvald</option>
                  <option>Píšť</option>
                  <option>Karviná</option>
                  <option>Ostrava</option>
                </select>
                <button type="submit" className="w-full bg-[#0a192f] text-white py-3 rounded-xl font-bold hover:bg-[#d4af37] transition-colors mt-2">
                  Odeslat objednávku
                </button>
              </div>
            </form>
          )}
          <button onClick={() => setIsOpen(false)} className="mt-4 text-xs text-slate-400 w-full text-center hover:underline italic">Zavřít košík</button>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
