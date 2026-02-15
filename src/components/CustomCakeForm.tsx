import React, { useState, useEffect } from 'react';

const CustomCakeForm = () => {
  const [selectedShop, setSelectedShop] = useState('ostrava');
  const [minDate, setMinDate] = useState('');

  const shopClosingDays: Record<string, number[]> = {
    ostrava: [0], karvina: [0], petrvald: [1], pist: [0, 6] 
  };

  const shopNames: Record<string, string> = {
    ostrava: 'v Ostravě', karvina: 'v Karviné', petrvald: 'v Petřvaldě', pist: 'v Píšti'
  };

  useEffect(() => {
    const dt = new Date();
    dt.setDate(dt.getDate() + 7);
    setMinDate(dt.toISOString().split('T')[0]);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (shopClosingDays[selectedShop].includes(date.getDay())) {
      alert(`Omlouváme se, ale v tento den má naše prodejna ${shopNames[selectedShop]} zavřeno.`);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-[#d4af37]/10 font-bold text-[#0a192f]">
      <h2 className="text-3xl font-serif mb-4 text-center italic">Konfigurátor dortu</h2>
      
      {/* KLASICKÝ FORMULÁŘ BEZ JAVASCRIPTU - PRO NETLIFY NEJISTĚJŠÍ */}
      <form 
        name="dort-na-prani" 
        method="POST" 
        action="/dekujeme"
        data-netlify="true" 
        encType="multipart/form-data"
        className="space-y-6 flex flex-col"
      >
        {/* Nutné pro Netlify u React komponent */}
        <input type="hidden" name="form-name" value="dort-na-prani" />
        
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-[#92782a]">Místo vyzvednutí</label>
          <select name="Prodejna" value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required>
            <option value="ostrava">Ostrava - Zábřeh</option>
            <option value="karvina">Karviná - Ráj</option>
            <option value="petrvald">Petřvald</option>
            <option value="pist">Píšť - Sídlo firmy</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-widest text-[#92782a]">Datum vyzvednutí</label>
          <input type="date" name="Datum_Vyzvednuti" min={minDate} onChange={handleDateChange} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="Jmeno" placeholder="Vaše jméno" required className="p-3 bg-slate-50 rounded-xl border border-slate-200" />
          <input type="email" name="Email" placeholder="Váš e-mail" required className="p-3 bg-slate-50 rounded-xl border border-slate-200" />
        </div>
        
        <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" />
        <textarea name="Zprava" placeholder="Popište vaši představu..." required className="w-full p-3 h-32 bg-slate-50 rounded-xl border border-slate-200"></textarea>
        
        <div className="p-6 bg-orange-50 border-2 border-dashed border-[#b38f2d]/30 rounded-2xl text-center">
          <label className="block text-xs font-bold text-[#92782a] uppercase mb-3">Inspirační obrázky (max 5)</label>
          {/* Změna názvu na prosté Inspiro-Foto bez [] nebo čísel */}
          <input 
            type="file" 
            name="Inspiro-Foto" 
            accept="image/*" 
            multiple 
            className="text-xs" 
          />
        </div>

        <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] transition-all uppercase tracking-widest">
          Odeslat poptávku
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
