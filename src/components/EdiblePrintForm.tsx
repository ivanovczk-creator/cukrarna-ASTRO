import React, { useState } from 'react';

const EdiblePrintForm = () => {
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map(file => file.name);
      setFileNames(names);
    }
  };

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
        name="tisk-na-papir" 
        method="POST" 
        data-netlify="true" 
        encType="multipart/form-data"
        action="/dekujeme"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <input type="hidden" name="form-name" value="tisk-na-papir" />
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Vaše jméno</label>
            <input type="text" name="Jmeno" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">E-mail</label>
               <input type="email" name="Email" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
            <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Telefon</label>
               <input type="tel" name="Telefon" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Místo vyzvednutí</label>
            <select name="Prodejna" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]">
              <option value="">Vyberte prodejnu...</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť</option>
              <option value="Karviná">Karviná</option>
              <option value="Ostrava">Ostrava (Zábřeh)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Datum vyzvednutí</label>
            <input type="date" name="Datum" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Obrázky (můžete vybrat více najednou)</label>
            <div className="relative w-full p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-[#d4af37] transition-all cursor-pointer">
              <input 
                type="file" 
                name="Tisk-Soubory[]" 
                multiple 
                onChange={handleFileChange}
                required 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept="image/*" 
              />
              <div className="text-sm text-slate-500">
                {fileNames.length > 0 ? (
                  <div className="text-[#0a192f] font-medium">
                    <p className="text-xs text-slate-400 mb-1 font-bold">Vybrané soubory:</p>
                    {fileNames.map((name, i) => <div key={i}>{name}</div>)}
                  </div>
                ) : (
                  "Klikněte pro výběr obrázků"
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Poznámka</label>
            <textarea name="Poznamka" className="w-full p-4 h-24 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="Např. ořez, nápis..."></textarea>
          </div>
        </div>

        <div className="md:col-span-2">
          <button type="submit" className="w-full bg-[#0a192f] text-white py-5 rounded-2xl font-bold hover:bg-[#d4af37] transition-all shadow-lg text-lg uppercase tracking-widest">
            Objednat tisk
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdiblePrintForm;
