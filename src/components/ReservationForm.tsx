import React, { useState, useEffect } from 'react';

const ReservationForm = () => {
  const [cart, setCart] = useState<{name: string, price: string, quantity: number, img: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const [selectedStore, setSelectedStore] = useState('Petřvald');
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    setMinDate(date.toISOString().split('T')[0]);

    const saved = localStorage.getItem('blahutovi_cart');
    if (saved) {
        try {
            setCart(JSON.parse(saved));
        } catch (e) {
            console.error("Chyba při načítání košíku", e);
        }
    }

    const handleAddToCart = (e: any) => {
      const { name, price, img, quantity } = e.detail;
      const qtyToAdd = parseInt(quantity) || 1;

      setCart(prev => {
        const existing = prev.find(item => item.name === name);
        let newCart;
        if (existing) {
          newCart = prev.map(item => item.name === name ? {...item, quantity: item.quantity + qtyToAdd} : item);
        } else {
          newCart = [...prev, { name, price, quantity: qtyToAdd, img }];
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Košík je prázdný.");
      return;
    }

    const formData = new FormData(e.currentTarget);
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

    const list = cart.map(item => `${item.quantity}x - ${item.name} (${item.price})`).join('\n');
    formData.append('Produkty-Seznam', list);
    
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData as any).toString(),
    })
    .then(() => {
      localStorage.removeItem('blahutovi_cart');
      window.location.href = "/dekujeme";
    })
    .catch((err) => alert("Omlouváme se, došlo k chybě: " + err));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative p-2 text-[#d4af37] transition-all duration-300 ${justAdded ? 'scale-125' : 'scale-100'}`}
        aria-label="Nákupní košík"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] min-w-[20px] h-[20px] flex items-center justify-center rounded-full font-bold border-2 border-[#0a192f]">
            {totalItems}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 border border-slate-100 text-[#0a192f] z-[100]">
            <div className="flex justify-between items-center mb-6 text-left">
              <h3 className="text-xl font-bold font-serif text-navy-900">Vaše objednávka</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8">Košík je prázdný</p>
            ) : (
              <form name="objednavka" method="POST" onSubmit={handleSubmit} data-netlify="true">
                <input type="hidden" name="form-name" value="objednavka" />
                <div className="max-h-48 overflow-y-auto mb-6 space-y-3 pr-2 scrollbar-thin">
                  {cart.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <img src={item.img} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-grow text-left text-navy-900">
                        <p className="font-bold text-xs leading-tight">{item.name}</p>
                        <p className="text-[10px] text-[#d4af37] font-bold">{item.quantity}x {item.price}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.name)} className="p-2 text-red-400 hover:text-red-600 transition-colors">✕</button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <input type="text" name="Jmeno" placeholder="Jméno a příjmení" required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" />
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <input type="email" name="Email" placeholder="E-mail" required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" />
                    <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <select name="Prodejna" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#d4af37]">
                      <option>Petřvald</option><option>Píšť</option><option>Karviná</option><option>Ostrava (Zábřeh)</option>
                    </select>
                    <input type="date" name="Datum" min={minDate} required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" />
                  </div>
                  <textarea name="Poznamka" placeholder="Poznámka k objednávce..." className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none h-20 resize-none focus:ring-1 focus:ring-[#d4af37]"></textarea>
                  <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] transition-all uppercase tracking-widest text-xs active:scale-95">
                    Odeslat rezervaci
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReservationForm;
