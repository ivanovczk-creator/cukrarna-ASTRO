import React, { useState } from 'react';

const CustomCakeForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-3xl font-serif text-[#4A3728] mb-4">Poptávka odeslána!</h3>
        <p className="text-slate-600 leading-relaxed mb-8">
          Děkujeme za váš zájem o dort na přání. Vaši poptávku i s přílohou jsme přijali. 
          Brzy se vám ozveme, abychom probrali detaily a cenu.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          className="text-[#D4AF37] font-bold hover:underline"
        >
          Odeslat další poptávku
        </button>
      </div>
    );
  }

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
          enctype="multipart/form-data"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <input type="hidden" name="form-name" value="dort-na-prani" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vaše Jméno *</label>
              <input 
                type="text" 
                name="jmeno" 
                required 
                placeholder="Jan Novák"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Telefon *</label>
              <input 
                type="tel" 
                name="telefon" 
                required 
                placeholder="+420 777 666 555"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">E-mail</label>
              <input 
                type="email" 
                name="email" 
                placeholder="vas@email.cz"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Popis vaší představy *</label>
            <textarea 
              name="popis" 
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
                name="foto" 
                accept="image/*"
                onChange={handleFileChange}
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
            <p className="mt-2 text-[10px] text-slate-400 italic">Maximální velikost souboru 10MB. Podporujeme JPG, PNG.</p>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
              Omlouváme se, při odesílání došlo k chybě. Zkuste to prosím znovu.
            </div>
          )}

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full min-h-[56px] bg-[#D4AF37] hover:bg-[#C4A132] disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            {status === 'submitting' ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Odesílám...
              </>
            ) : "Odeslat nezávaznou poptávku"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomCakeForm;