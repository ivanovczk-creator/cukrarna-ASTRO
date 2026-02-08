import React, { useState, useEffect } from 'react';

const ReservationForm = () => {
  const [cart, setCart] = useState<{name: string, price: string, quantity: number, img: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState('Petřvald');
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    // Výpočet minimálního data (2 dny dopředu)
    const date = new Date();
    date.setDate(date.getDate() + 2);
    setMinDate(date.toISOString().split('T')[0]);

    // Načtení košíku z localStorage
    const saved = localStorage.getItem('blahutovi_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Chyba při parsování košíku");
      }
    }

    const handleAddToCart = (e: any) => {
      const { name, price, img, quantity } = e.detail;
      const q = parseInt(quantity) || 1;
      
      setCart(prev => {
        const existing = prev.find(item => item.name === name);
        let newCart;
        if (existing) {
          newCart = prev.map(item => item.name === name ? {...item, quantity: item.quantity + q} : item);
        } else {
          newCart = [...prev, { name, price, quantity: q, img }];
        }
        localStorage.setItem('blahutovi_cart', JSON.stringify(newCart));
        return newCart;
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
    };

    window.addEventListener('add-to-cart', handleAddToCart);
    return () => window.removeEventListener('add-to-cart', handleAddToCart);
  }, []);

  const removeItem = (name: string) => {
    const newCart = cart.filter(item => item.name !== name);
    setCart(newCart);
    localStorage.setItem('blahutovi_cart', JSON.stringify(newCart));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Validace otevírací doby
    const dateVal = new Date(formData.get('Datum') as string);
    const day = dateVal.getDay();
    const isClosed = (selectedStore === 'Petřvald' && day === 1) || 
                     (selectedStore === 'Píšť' && (day === 0 || day === 6)) || 
                     (selectedStore === 'Karviná' && day === 0) || 
                     (selectedStore === 'Ostrava (Zábřeh)' && day === 0);

    if (isClosed) {
      alert(`Vámi vybraná prodejna (${selectedStore}) má v tento den zavřeno. Prosím vyberte jiné datum.`);
      return;
    }

    const list = cart.map(item => 
      `${item.quantity}x ${item.name} (${item.price})\nOdkaz: ${window.location.origin}${item.img}`
    ).join('\n\n---\n\n');
    
    formData.append('Produkty-Seznam', list);
    
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });
      localStorage.removeItem('blahutovi_cart');
      window.location.href = "/dekujeme";
    } catch (err) {
      alert("Chyba při odesílání: " + err);
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
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
        <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 border border-slate-100 text-[#0a192f] z-[100]">
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

          {cart.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8 font-bold">Košík je prázdný</p>
          ) : (
            <form name="objednavka" method="POST" onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="form-name" value="objednavka" />
              <div className="max-h-48 overflow-y-auto mb-6 space-y-3 pr-2 scrollbar-thin">
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <img src={item.img} alt="" className="w-10 h-10 object-cover rounded-lg" loading="lazy" />
                    <div className="flex-grow">
                      <p className="font-bold text-xs leading-tight">{item.name}</p>
                      <p className="text-[10px] text-[#92782a] font-black">{item.quantity}x {item.price}</p>
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

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <input type="text" name="Jmeno" placeholder="Jméno a příjmení" required className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-[#d4af37] outline-none font-bold" />
                <div className="grid grid-cols-2 gap-2">
                    <input type="email" name="Email" placeholder="E-mail" required className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-[#d4af37] outline-none font-bold" />
                    <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-[#d4af37] outline-none font-bold" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <select 
                      name="Prodejna" 
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-[#d4af37] outline-none font-bold"
                    >
                      <option>Petřvald</option>
                      <option>Píšť</option>
                      <option>Karviná</option>
                      <option>Ostrava (Zábřeh)</option>
                    </select>
                    <input 
                      type="date" 
                      name="Datum" 
                      min={minDate}
                      required 
                      className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-[#d4af37] outline-none font-bold" 
                    />
                </div>
                
                <textarea name="Poznamka" placeholder="Poznámka k objednávce (nepovinné)" className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none h-20 resize-none border border-transparent focus:border-[#d4af37] font-bold"></textarea>

                <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] hover:text-[#0a192f] transition-all shadow-lg active:scale-95 cursor-pointer uppercase tracking-widest text-[10px]">
                  Odeslat rezervaci
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
