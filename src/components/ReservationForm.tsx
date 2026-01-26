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
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1000);
    };

    window.addEventListener('add-to-cart', handleAddToCart);
    return () => window.removeEventListener('add-to-cart', handleAddToCart);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Pomocná funkcia pre odoslanie na Netlify (pre React formuláre)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData as any).toString(),
    })
      .then(() => window.location.href = "/dekujeme")
      .catch((error) => alert(error));
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={`relative p-2 text-[#d4af37] transition-all ${justAdded ? 'scale-125' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0a192f]">{totalItems}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100 text-[#0a192f] z-[100]">
          <h3 className="text-2xl font-serif font-bold mb-6">Vaša objednávka</h3>

          {cart.length === 0 ? <p className="text-slate-400 italic">Košík je prázdny</p> : (
            <form name="objednavka" method="POST" onSubmit={handleSubmit}>
              {/* Nutné pre Netlify */}
              <input type="hidden" name="form-name" value="objednavka" />
              
              <div className="max-h-60 overflow-y-auto mb-6">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm mb-2 p-2 bg-slate-50 rounded-lg">
                    <input type="hidden" name={`Produkt-${i}`} value={`${item.name} (${item.quantity}x)`} />
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-bold">{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <input type="text" name="Meno" placeholder="Meno a priezvisko" required className="w-full p-3 bg-slate-100 rounded-xl" />
                <input type="email" name="Email" placeholder="Váš e-mail" required className="w-full p-3 bg-slate-100 rounded-xl" />
                <input type="tel" name="Telefon" placeholder="Telefón" required className="w-full p-3 bg-slate-100 rounded-xl" />
                
                <select name="Predajna" className="w-full p-3 bg-slate-100 rounded-xl">
                  <option>Petřvald</option><option>Píšť</option><option>Karviná</option><option>Ostrava</option>
                </select>

                <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37]">
                  Odoslať rezerváciu
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
