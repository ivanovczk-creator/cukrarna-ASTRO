import React, { useState, useEffect } from 'react';

const CustomCakeForm = () => {
  const [selectedShop, setSelectedShop] = useState('ostrava');
  const [minDate, setMinDate] = useState('');

  // Logika zavíracích dnů (0 = Neděle, 1 = Pondělí, atd.)
  const shopClosingDays: Record<string, number[]> = {
    ostrava: [0], 
    karvina: [0], 
    petrvald: [1], 
    pist: [0, 6] 
  };

  const shopNames: Record<string, string> = {
    ostrava: 'v Ostravě',
    karvina: 'v Karviné',
    petrvald: 'v Petřvaldě',
    pist: 'v Píšti'
  };

  useEffect(() => {
    // Nastavení minimálního data (Dnešek + 7 dní) - toto prohlížeč zešedí automaticky
    const dt = new Date();
    dt.setDate(dt.getDate() + 7);
    setMinDate(dt.toISOString().split('T')[0]);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const day = date.getDay();
    
    if (shopClosingDays[selectedShop].includes(day)) {
      alert(`Omlouváme se, ale v tento den má naše prodejna ${shopNames[selectedShop]} zavřeno. Prosím vyberte jiný den.`);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-[#d4af37]/10 font-bold text-[#0a192f]">
      <h2 className="text-3xl font-serif mb-4 text-center italic">Konfigurátor dortu</h2>
      
      <form 
        name="dort-na-prani" 
        method="POST" 
        data-netlify="true" 
        action="/dekujeme" 
        encType="multipart/form-data"
        className="space-y-6 flex flex-col"
      >
        <input type="hidden" name="form-name" value="dort-na-prani" />
        
        {/* Výběr prodejny - čistý bez nápisů o zavíračce */}
        <div className="flex flex-col gap-1">
          <label htmlFor="shop-select" className="text-xs uppercase tracking-widest text-[#92782a]">Místo vyzvednutí</label>
          <select 
            id="shop-select"
            name="Prodejna" 
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] font-bold"
            required
          >
            <option value="ostrava">Ostrava - Zábřeh</option>
            <option value="karvina">Karviná - Ráj</option>
            <option value="petrvald">Petřvald</option>
            <option value="pist">Píšť - Sídlo firmy</option>
          </select>
        </div>

        {/* Kalendář - automaticky zešedne vše před +7 dny */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cake-date" className="text-xs uppercase tracking-widest text-[#92782a]">Datum vyzvednutí</label>
          <input 
            id="cake-date"
            type="date" 
            name="Datum_Vyzvednuti"
            min={minDate}
            onChange={handleDateChange}
            className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] font-bold"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="Jmeno" placeholder="Vaše jméno" required className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] font-bold" />
          <input type="email" name="Email" placeholder="Váš e-mail" required className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] font-bold" />
        </div>
        
        <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] font-bold" />
        
        <textarea name="Zprava" placeholder="Popište vaši představu (počet porcí, příchuť...)" required className="w-full p-3 h-32 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] font-bold"></textarea>
        
        <div className="p-6 bg-orange-50 border-2 border-dashed border-[#b38f2d]/30 rounded-2xl text-center">
          <label htmlFor="cake-file" className="block text-xs font-bold text-[#92782a] uppercase mb-3">Inspirační obrázky (můžete vybrat i více)</label>
          <input 
            id="cake-file" 
            type="file" 
            name="Inspiro-Foto" 
            accept="image/*" 
            multiple
            className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0a192f] file:text-white file:cursor-pointer hover:file:bg-[#d4af37] hover:file:text-[#0a192f] transition-all" 
          />
        </div>

        <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] hover:text-[#0a192f] transition-all shadow-lg uppercase tracking-widest active:scale-95 cursor-pointer">
          Odeslat nezávaznou poptávku
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
