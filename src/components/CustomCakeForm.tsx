import React, { useState } from 'react';

const CustomCakeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-gold-500/10 text-[#0a192f]">
      <h2 className="text-3xl font-serif mb-4 text-center italic">Dort na přání</h2>
      <p className="text-center text-slate-500 mb-8 text-sm">
        Máte vlastní představu? Nahrajte obrázek a my vám připravíme dort podle vaší předlohy.
      </p>
      
      <form 
        name="dort-na-prani" 
        method="POST" 
        data-netlify="true" 
        action="/dekujeme" 
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input type="hidden" name="form-name" value="dort-na-prani" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-2 font-bold">Jméno</label>
            <input type="text" name="Jmeno" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37] transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-2 font-bold">E-mail</label>
            <input type="email" name="Email" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37] transition-all" />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-2 font-bold">Telefon</label>
          <input type="tel" name="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37] transition-all" />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-400 ml-2 font-bold">Vaše představa</label>
          <textarea 
            name="Zprava" 
            placeholder="Počet porcí, příchuť, datum vyzvednutí..." 
            required 
            className="w-full p-3 h-32 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37] transition-all resize-none"
          ></textarea>
        </div>
        
        <div className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${fileName ? 'border-[#d4af37] bg-gold-50/20' : 'border-slate-200 bg-slate-50'}`}>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-tighter">
            {fileName ? 'Obrázek vybrán' : 'Inspirační obrázek (Povinné)'}
          </label>
          <div className="relative">
            <input 
              type="file" 
              name="Inspiro-Foto" 
              accept="image/*" 
              required 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mb-2 ${fileName ? 'text-[#d4af37]' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                {fileName ? fileName : 'Klikněte pro nahrání fotografie'}
              </span>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full text-white py-5 rounded-2xl font-bold transition-all shadow-lg uppercase tracking-widest text-sm ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0a192f] hover:bg-[#d4af37] active:scale-95'}`}
        >
          {isSubmitting ? 'Odesílám poptávku...' : 'Odeslat poptávku'}
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
