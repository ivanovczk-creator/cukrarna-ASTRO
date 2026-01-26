import React, { useState, useEffect } from 'react';

const ReservationForm = () => {
  const [cart, setCart] = useState<{name: string, price: string, quantity: number}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

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
      
      // Místo otevření celého košíku jen krátce blikneme ikonou
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
    };

    window.addEventListener('add-to-cart', handleAddToCart);
    return () => window.removeEventListener('add-to-cart', handleAddToCart);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="relative">
      {/* Ikona košíku v menu */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative p-2 text-[#d4af37] transition-all duration-300 ${justAdded ? 'scale-150' : 'scale-100'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-[#0a192f]">
            {totalItems}
          </span>
        )}
      </button>

      {/* Overlay pro zavření kliknutím mimo */}
      {isOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)}></div>}

      {/* Panel košíku */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100 text-[#0a192f] z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-serif font-bold">Vaše objednávka</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-black">✕</button>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 italic">Zatím jste si nic nevybrali...</p>
            </div>
          ) : (
            <form name="objednavka" method="POST" data-netlify="true" action="/dekujeme">
              <input type="hidden" name="form-name" value="objednavka" />
              
              <div className="max-h-60 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input type="hidden" name={`Produkt-${i}`} value={`${item.name} (${item.quantity}x)`} />
                    <div className="flex-grow">
                      <p className="font-bold text-[#0a192f]">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.price} / ks</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="bg-[#d4af37] text-white px-2 py-1 rounded-lg font-bold text-xs">{item.quantity}x</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t pt-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Kontaktní údaje</p>
                <input type="text" name="Jmeno" placeholder="Vaše jméno a příjmení" required className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#d4af37] outline-none" />
                <input type="tel" name="Telefon" placeholder="Telefon (pro potvrzení)" required className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#d4af37] outline-none" />
                
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Kde si objednávku vyzvednete?</label>
                <select name="Prodejna" className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#d4af37] outline-none">
                  <option>Petřvald</option>
                  <option>Píšť</option>
                  <option>Karviná</option>
                  <option>Ostrava (Zábřeh)</option>
                </select>
                
                <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] transition-all shadow-xl shadow-[#0a192f]/20 mt-4 active:scale-95">
                  Odeslat rezervaci
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-4">
                  Rezervace je nezávazná. Počkáme na vás s dobrotami na prodejně.
                </p>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
