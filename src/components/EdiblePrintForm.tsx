import React, { useState } from 'react';

const EdiblePrintForm = () => {
  const [status, setStatus] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 bg-[#f8fafc] rounded-[3rem] border border-slate-200 shadow-xl text-[#0a192f]">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif mb-4 italic">Tisk na jedlý papír</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Vytiskneme vaši fotografii nebo obrázek na kvalitní fondánový list formátu A4. 
          Ideální pro personalizaci vašich domácích dortů.
        </p>
        <div className="mt-4 inline-block bg-[#d4af37] text-[#0a192f] px-6 py-2 rounded-full font-bold shadow-sm">
          Cena: 160 Kč / list A4
        </div>
      </div>

      <form 
        name="tisk-na-papir" 
        method="POST" 
        data-netlify="true" 
        enctype="multipart/form-data"
        action="/dekujeme"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <input type="hidden" name="form-name" value="tisk-na-papir" />
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Vaše jméno</label>
            <input type="text" name="Jmeno" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="Jan Novák" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">E-mail</label>
            <input type="email" name="Email" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="email@seznam.cz" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Telefon</label>
            <input type="tel" name="Telefon" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="+420 000 000 000" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Obrázek k tisku</label>
            <div className="relative w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-[#d4af37] transition-colors cursor-pointer">
              <input type="file" name="Tisk-Soubor" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
              <p className="text-sm text-slate-500">Klikněte pro nahrání obrázku (JPG/PNG)</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Poznámka k tisku</label>
            <textarea name="Zprava" className="w-full p-4 h-32 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="Např. ořez do kruhu, text na obrázek..."></textarea>
          </div>
        </div>

        <div className="md:col-span-2">
          <button type="submit" className="w-full bg-[#0a192f] text-white py-5 rounded-2xl font-bold hover:bg-[#d4af37] transition-all shadow-lg active:scale-95 text-lg uppercase tracking-widest">
            Objednat tisk
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdiblePrintForm;
