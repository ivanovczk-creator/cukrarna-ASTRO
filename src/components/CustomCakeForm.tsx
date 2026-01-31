import React from 'react';

const CustomCakeForm = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-[#d4af37]/10">
      <h2 className="text-3xl font-serif text-[#0a192f] mb-4 text-center">Dort na přání</h2>
      <p className="text-center text-slate-600 mb-8 text-sm">Nahrajte obrázek a my vám připravíme dort podle vaší předlohy.</p>
      
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
          <div className="flex flex-col gap-1">
            <label htmlFor="cake-name" className="sr-only">Vaše jméno</label>
            <input id="cake-name" type="text" name="Jmeno" placeholder="Vaše jméno" required className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f]" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cake-email" className="sr-only">Váš e-mail</label>
            <input id="cake-email" type="email" name="Email" placeholder="Váš e-mail" required className="p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f]" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="cake-phone" className="sr-only">Telefon</label>
          <input id="cake-phone" type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f]" />
        </div>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="cake-message" className="sr-only">Popište vaši představu</label>
          <textarea id="cake-message" name="Zprava" placeholder="Popište vaši představu (počet porcí, příchuť...)" required className="w-full p-3 h-32 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-[#d4af37] text-[#0a192f]"></textarea>
        </div>
        
        <div className="p-4 bg-orange-50 border-2 border-dashed border-[#b38f2d]/30 rounded-2xl text-center">
          <label htmlFor="cake-file" className="block text-xs font-bold text-[#92782a] uppercase mb-2">Inspirační obrázek (Povinné)</label>
          <input id="cake-file" type="file" name="Inspiro-Foto" accept="image/*" required className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0a192f] file:text-white file:cursor-pointer" />
        </div>

        <button type="submit" className="w-full bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] hover:text-[#0a192f] transition-all shadow-lg cursor-pointer uppercase tracking-widest">
          Odeslat poptávku
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
