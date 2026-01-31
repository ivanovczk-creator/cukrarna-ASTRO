import React from 'react';

const CustomCakeForm = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-gold-500/10">
      <h2 className="text-3xl font-serif text-[#0a192f] mb-4 text-center">Dort na přání</h2>
      <p className="text-center text-slate-500 mb-8 text-sm">Nahrajte obrázek a my vám připravíme dort podle vaší předlohy.</p>
      
      <form 
        name="dort-na-prani" 
        method="POST" 
        data-netlify="true" 
        action="/dekujeme" 
        encType="multipart/form-data"
        className="space-y-4"
      >
        <input type="hidden" name="form-name" value="dort-na-prani" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="Jmeno" placeholder="Vaše jméno" required className="p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37]" />
          <input type="email" name="Email" placeholder="Váš e-mail" required className="p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37]" />
        </div>
        
        <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37]" />
        
        <textarea name="Zprava" placeholder="Popište vaši představu (počet porcí, příchuť...)" required className="w-full p-3 h-32 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-[#d4af37]"></textarea>
        
        <div className="p-4 bg-gold-50 border-2 border-dashed border-[#d4af37]/30 rounded-2xl text-center">
          <label className="block text-xs font-bold text-gold-600 uppercase mb-2">Inspirační obrázek (Povinné)</label>
          <input type="file" name="Inspiro-Foto" accept="image/*" required className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0a192f] file:text-white" />
        </div>

        <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] transition-all shadow-lg">
          Odeslat poptávku
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
