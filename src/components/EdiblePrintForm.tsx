import React, { useState } from 'react';

const EdiblePrintForm = () => {
  const [userName, setUserName] = useState(''); // State pro jméno kvůli předmětu e-mailu
  const [selectedStore, setSelectedStore] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 bg-[#f8fafc] rounded-[3rem] border border-slate-200 shadow-xl text-[#0a192f]">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif mb-4 italic">Tisk na jedlý papír</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Nahrajte své obrázky a my je vytiskneme na kvalitní fondánový list A4.
        </p>
        <div className="mt-4 inline-block bg-[#d4af37] text-[#0a192f] px-6 py-2 rounded-full font-bold shadow-sm">
          Cena: 160 Kč / list A4
        </div>
      </div>

      <form 
        name="tisk-na-papir-v2" 
        method="POST" 
        data-netlify="true" 
        encType="multipart/form-data"
        action="/dekujeme"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <input type="hidden" name="form-name" value="tisk-na-papir-v2" />
        
        {/* DYNAMICKÝ PŘEDMĚT PRO BLUEMAIL */}
        <input 
          type="hidden" 
          name="subject" 
          value={`TISK: ${userName || 'Nová poptávka'} - ${selectedStore || 'Nespecifikováno'}`} 
        />
        
        <div className="space-y-4">
          <div>
            <label htmlFor="edible-name" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Vaše jméno</label>
            <input 
              id="edible-name" 
              type="text" 
              name="Jmeno" 
              required 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label htmlFor="edible-email" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">E-mail</label>
               <input id="edible-email" type="email" name="Email" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
               <label htmlFor="edible-phone" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Telefon</label>
               <input id="edible-phone" type="tel" name="Telefon" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
          </div>
          
          <div>
            <label htmlFor="edible-store" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Místo vyzvednutí</label>
            <select 
              id="edible-store" 
              name="Prodejna" 
              required 
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              <option value="">Vyberte prodejnu...</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť</option>
              <option value="Karviná">Karviná</option>
              <option value="Ostrava">Ostrava (Zábřeh)</option>
            </select>
          </div>

          <div>
            <label htmlFor="edible-date" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Datum vyzvednutí</label>
            <input id="edible-date" type="date" name="Datum" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Obrázky k tisku (max. 3)</label>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
              <input type="file" name="Tisk-Foto-1" accept="image/*" className="text-xs w-full file:bg-[#0a192f] file:text-white file:rounded-lg file:border-0 file:px-3 file:py-1 file:mr-3" />
              <input type="file" name="Tisk-Foto-2" accept="image/*" className="text-xs w-full file:bg-[#0a192f] file:text-white file:rounded-lg file:border-0 file:px-3 file:py-1 file:mr-3" />
              <input type="file" name="Tisk-Foto-3" accept="image/*" className="text-xs w-full file:bg-[#0a192f] file:text-white file:rounded-lg file:border-0 file:px-3 file:py-1 file:mr-3" />
            </div>
          </div>
          <div>
            <label htmlFor="edible-note" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Poznámka</label>
            <textarea id="edible-note" name="Poznamka" className="w-full p-4 h-24 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] resize-none" placeholder="Např. ořez, nápis..."></textarea>
          </div>
        </div>

        <div className="md:col-span-2">
          <button type="submit" className="w-full bg-[#0a192f] text-white py-5 rounded-2xl font-bold hover:bg-[#d4af37] hover:text-[#0a192f] transition-all shadow-lg text-lg uppercase tracking-widest cursor-pointer">
            Objednat tisk
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdiblePrintForm;
