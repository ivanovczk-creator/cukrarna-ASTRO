import React, { useState } from 'react';

const CustomCakeForm: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  // Funkci handleSubmit jsme odstranili a nahradili ji přímým odesláním formuláře,
  // což zajistí, že Netlify správně zpracuje soubor a provede přesměrování na /dekujeme/

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-serif mb-6 text-[#4A3728]">Dort na přání</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Máte vlastní představu? Pošlete nám fotku nebo popis a my vám upečeme dort přesně podle vašich představ.
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100">
        <form 
          name="dort-na-prani" 
          method="POST" 
          data-netlify="true" 
          encType="multipart/form-data"
          action="/dekujeme/"
          className="space-y-6"
        >
          {/* Skryté pole pro Netlify identifikaci */}
          <input type="hidden" name="form-name" value="dort-na-prani" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vaše Jméno *</label>
              <input 
                type="text" 
                name="Jmeno" 
                required 
                placeholder="Jan Novák"
                className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Telefon *</label>
              <input 
                type="tel" 
                name="Telefon" 
                required 
                placeholder="+420 777 666 555"
                className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">E-mail *</label>
              <input 
                type="email" 
                name="Email" 
                required
                placeholder="vas@email.cz"
                className="w-full min-h-[44px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Popis vaší představy *</label>
            <textarea 
              name="Popis" 
              required
              rows={4} 
              placeholder="Popište nám, jak by měl dort vypadat, pro kolik osob by měl být a na jaký termín..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Máte předlohu? Nahrajte fotku</label>
            <div className="relative group">
              <input 
                type="file" 
                name="Soubor Fotka" 
                accept="image/*"
                onChange={handleFileChange}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full min-h-[64px] px-4 py-4 rounded-xl border-2 border-dashed border-slate-200 group-hover:border-[#E8A2AF] bg-slate-50 flex items-center justify-center gap-3 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-[#E8A2AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-slate-500">
                  {fileName || "Vybrat soubor z galerie nebo vyfotit"}
                </span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full min-h-[56px] bg-[#D4AF37] hover:bg-[#C4A132] text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            Odeslat nezávaznou poptávku
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomCakeForm;
