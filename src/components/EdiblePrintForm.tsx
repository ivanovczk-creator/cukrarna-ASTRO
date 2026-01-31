import React, { useState, useEffect } from 'react';

const EdiblePrintForm = () => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [minDate, setMinDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');

  useEffect(() => {
    // Nastavení minimálního data na +2 dny
    const date = new Date();
    date.setDate(date.getDate() + 2);
    setMinDate(date.toISOString().split('T')[0]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map(file => file.name);
      setFileNames(names);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const dateVal = new Date(formData.get('Datum') as string);
    const day = dateVal.getDay();

    // Logika zavíracích dnů (shodná s ReservationForm)
    const store = formData.get('Prodejna') as string;
    const isClosed = (store === 'Petřvald' && day === 1) || 
                     (store === 'Píšť' && (day === 0 || day === 6)) || 
                     (store === 'Karviná' && day === 0) || 
                     (store === 'Ostrava (Zábřeh)' && day === 0);

    if (isClosed) {
      e.preventDefault();
      alert(`Vámi vybraná prodejna (${store}) má v tento den zavřeno. Prosím vyberte jiné datum.`);
      return;
    }

    setIsSubmitting(true);
    // Form se odešle standardně přes Netlify díky method="POST"
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 bg-[#f8fafc] rounded-[3rem] border border-slate-200 shadow-xl text-[#0a192f]">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif mb-4 italic">Tisk na jedlý papír</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Nahrajte své obrázky a my je vytiskneme na kvalitní fondánový list A4.
        </p>
        <div className="mt-4 inline-block bg-[#d4af37] text-[#0a192f] px-6 py-2 rounded-full font-bold shadow-sm text-sm">
          Cena: 160 Kč / list A4
        </div>
      </div>

      <form 
        name="tisk-na-papir" 
        method="POST" 
        data-netlify="true" 
        encType="multipart/form-data"
        action="/dekujeme"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <input type="hidden" name="form-name" value="tisk-na-papir" />
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Vaše jméno</label>
            <input type="text" name="Jmeno" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">E-mail</label>
               <input type="email" name="Email" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] transition-all" />
            </div>
            <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Telefon</label>
               <input type="tel" name="Telefon" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] transition-all" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Místo vyzvednutí</label>
            <select 
              name="Prodejna" 
              required 
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] transition-all cursor-pointer"
            >
              <option value="">Vyberte prodejnu...</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť</option>
              <option value="Karviná">Karviná</option>
              <option value="Ostrava (Zábřeh)">Ostrava (Zábřeh)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Datum vyzvednutí (min. za 2 dny)</label>
            <input type="date" name="Datum" min={minDate} required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] transition-all" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Obrázky (můžete vybrat více)</label>
            <div className={`relative w-full p-6 bg-white border-2 border-dashed rounded-2xl text-center hover:border-[#d4af37] transition-all cursor-pointer ${fileNames.length > 0 ? 'border-[#d4af37]' : 'border-slate-200'}`}>
              <input 
                type="file" 
                name="Tisk-Soubor" 
                multiple 
                onChange={handleFileChange}
                required 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept="image/*" 
              />
              <div className="text-sm text-slate-500">
                {fileNames.length > 0 ? (
                  <div className="text-[#0a192f] font-medium">
                    <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase">Vybráno {fileNames.length} souborů:</p>
                    <div className="max-h-24 overflow-y-auto text-xs space-y-1">
                        {fileNames.map((name, i) => <div key={i} className="truncate">{name}</div>)}
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Klikněte pro výběr obrázků</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Poznámka</label>
            <textarea name="Poznamka" className="w-full p-4 h-32 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37] transition-all resize-none" placeholder="Např. ořez, počet kusů, nápis na fotku..."></textarea>
          </div>
        </div>

        <div className="md:col-span-2 mt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full text-white py-5 rounded-2xl font-bold transition-all shadow-lg text-lg uppercase tracking-widest ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0a192f] hover:bg-[#d4af37] active:scale-95'}`}
          >
            {isSubmitting ? 'Odesílám...' : 'Objednat tisk'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdiblePrintForm;
