import React, { useState, useEffect } from 'react';

const ReservationForm = () => {
  const [cart, setCart] = useState<{name: string, price: string, quantity: number, img: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Načtení košíku z paměti prohlížeče při startu
  useEffect(() => {
    const savedCart = localStorage.getItem('blahutovi-cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    
    const handleAddToCart = (e: any) => {
      const { name, price, img } = e.detail;
      setCart(prev => {
        const existing = prev.find(item => item.name === name);
        let newCart;
        if (existing) {
          newCart = prev.map(item => item.name === name ? {...item, quantity: item.quantity + 1} : item);
        } else {
          newCart = [...prev, { name, price, quantity: 1, img }];
        }
        localStorage.setItem('blahutovi-cart', JSON.stringify(newCart));
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
    localStorage.setItem('blahutovi-cart', JSON.stringify(newCart));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productList = cart.map(item => 
      `${item.quantity}x ${item.name} (${item.price})\nOdkaz: ${window.location.origin}${item.img}`
    ).join('\n\n---\n\n');
    
    formData.append('Produkty-Seznam', productList);
    
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData as any).toString(),
    })
    .then(() => {
      localStorage.removeItem('blahutovi-cart'); // Vymazání košíku po úspěchu
      window.location.href = "/dekujeme";
    })
    .catch((error) => alert("Chyba při odesílání: " + error));
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={`relative p-2 text-[#d4af37] transition-all duration-300 ${justAdded ? 'scale-125' : 'scale-100'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0a192f]">{totalItems}</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[90] bg-black/20 md:bg-transparent" onClick={() => setIsOpen(false)}></div>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[90vw] md:w-96 bg-white rounded-[2rem] shadow-2xl p-6 md:p-8 border border-slate-100 text-[#0a192f] z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-serif font-bold">Vaše objednávka</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-black">✕</button>
          </div>

          {cart.length === 0 ? (
            <p className="text-slate-400 italic text-center py-10">Košík je prázdný</p>
          ) : (
            <form name="objednavka" method="POST" onSubmit={handleSubmit}>
              <input type="hidden" name="form-name" value="objednavka" />
              <div className="max-h-60 overflow-y-auto mb-6 space-y-3">
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 relative group text-left">
                    <img src={item.img} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-grow pr-6">
                      <p className="font-bold text-sm leading-tight">{item.name}</p>
                      <p className="text-xs text-[#d4af37] font-bold">{item.quantity}x {item.price}</p>
                    </div>
                    <button type="button" onClick={() => removeItem(item.name)} className="text-red-400 hover:text-red-600 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <input type="text" name="Jmeno" placeholder="Jméno a příjmení" required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#d4af37]" />
                <input type="email" name="Email" placeholder="Váš e-mail" required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#d4af37]" />
                <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#d4af37]" />
                <select name="Prodejna" className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#d4af37]">
                  <option>Petřvald</option><option>Píšť</option><option>Karviná</option><option>Ostrava (Zábřeh)</option>
                </select>
                <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] transition-all shadow-lg mt-2 active:scale-95">Odeslat rezervaci</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationForm;
