import React, { useState, useEffect } from 'react';

const CustomCakeForm = () => {
  const [selectedShop, setSelectedShop] = useState('ostrava');
  const [minDate, setMinDate] = useState('');

  // Definice zavíracích dnů (0 = Neděle, 1 = Pondělí, atd.)
  const shopClosingDays: Record<string, number[]> = {
    ostrava: [0], // Neděle zavřeno
    karvina: [0], // Neděle zavřeno
    petrvald: [1], // Pondělí zavřeno
    pist: [0, 6] // Sobota a Neděle zavřeno
  };

  useEffect(() => {
    // Nastavení minimálního data (Dnešek + 7 dní)
    const dt = new Date();
    dt.setDate(dt.getDate() + 7);
    setMinDate(dt.toISOString().split('T')[0]);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const day = date.getDay();
    
    if (shopClosingDays[selectedShop].includes(day)) {
      alert('V tento den má vybraná prodejna zavřeno. Prosím, vyberte jiný termín.');
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-[#d4af37]/10 font-bold">
      <h2 className="text-3xl font-serif text-[#0a192f] mb-4 text-center italic">Konfigurátor dortu</h2>
      <p className="text-center text-slate-600 mb-8 text-sm font-bold">Popište nám svou představu a my se vám ozveme s cenovou nabídkou.</p>
      
      <form 
        name="dort-na-prani" 
        method="POST" 
        data-netlify="true" 
        action="/dekujeme" 
        encType="multipart/form-data"
        className="space-y-6 flex flex-col"
      >
        <input type="hidden" name="form-name" value="dort-na-prani" />
        
        {/* Výběr prodejny */}
        <div className="flex flex-col gap-1">
          <label htmlFor="shop-select" className="text-xs uppercase tracking-widest text-[#92782a] font-bold">Kde si dort vyzvednete?</label>
          <select 
            id="shop-select"
            name="Prodejna" 
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f] font-bold"
            required
          >
            <option value="ostrava">Ostrava - Zábřeh (Zavřeno v neděli)</option>
            <option value="karvina">Karviná - Ráj (Zavřeno v neděli)</option>
            <option value="petrvald">Petřvald (Zavřeno v pondělí)</option>
            <option value="pist">Píšť - Sídlo (Zavřeno o víkendu)</option>
          </select>
        </div>

        {/* Kalendář s hlídáním +7 dní */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cake-date" className="text-xs uppercase tracking-widest text-[#92782a] font-bold">Datum vyzvednutí (min. 7 dní předem)</label>
          <input 
            id="cake-date"
            type="date" 
            name="Datum_Vyzvednuti"
            min={minDate}
            onChange={handleDateChange}
            className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f] font-bold"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <input type="text" name="Jmeno" placeholder="Vaše jméno" required className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f] font-bold" />
          </div>
          <div className="flex flex-col gap-1">
            <input type="email" name="Email" placeholder="Váš e-mail" required className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f] font-bold" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f] font-bold" />
        </div>
        
        <div className="flex flex-col gap-1">
          <textarea name="Zprava" placeholder="Popište vaši představu (počet porcí, příchuť...)" required className="w-full p-3 h-32 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f] font-bold"></textarea>
        </div>
        
        {/* Nahrávání více fotek */}
        <div className="p-6 bg-orange-50 border-2 border-dashed border-[#b38f2d]/30 rounded-2xl text-center">
          <label htmlFor="cake-file" className="block text-xs font-bold text-[#92782a] uppercase mb-3">Inspirační obrázky (Můžete vybrat i více najednou)</label>
          <input 
            id="cake-file" 
            type="file" 
            name="Inspiro-Foto" 
            accept="image/*" 
            multiple
            className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0a192f] file:text-white file:cursor-pointer hover:file:bg-[#d4af37] hover:file:text-[#0a192f] transition-all" 
          />
          <p className="mt-2 text-[10px] text-slate-400 font-bold">TIP: Na mobilu můžete vybrat více fotek podržením prstu na obrázku.</p>
        </div>

        <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] hover:text-[#0a192f] transition-all shadow-lg cursor-pointer uppercase tracking-widest active:scale-95">
          Odeslat nezávaznou poptávku
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
