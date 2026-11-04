import React, { useState } from 'react';
import PickupDateInput from './PickupDateInput';
import { BLOCKED_DATE_MESSAGE, isBlockedDate } from '../lib/blockedDates';
import { MAX_FILES, MAX_FILE_BYTES, uploadPrintFiles, validateSelection } from '../lib/printUpload';

const EdiblePrintForm = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Soubory se nenahrávají přes Netlify Forms (jejich odkazy v e-mailu jsou za přihlášením),
  // ale přes vlastní funkci /api/upload-print → do formuláře jdou jen veřejné odkazy ke stažení.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubmitError(null);

    const rawDate = formData.get('Datum');
    if (typeof rawDate === 'string' && isBlockedDate(rawDate)) {
      alert(BLOCKED_DATE_MESSAGE);
      return;
    }

    const problem = validateSelection(files);
    if (problem) {
      setFileError(problem);
      return;
    }

    setIsSubmitting(true);
    try {
      const links = await uploadPrintFiles(files);
      formData.set('Tisk-Odkazy', links.join('\n'));

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      if (!res.ok) throw new Error(`Server vrátil ${res.status}`);
      window.location.href = '/dekujeme';
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Odeslání se nezdařilo.');
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    const problem = selected.length ? validateSelection(selected) : null;
    setFileError(problem);
    // nativní validace: formulář nejde odeslat s nevalidním výběrem
    e.target.setCustomValidity(problem ?? '');
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
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <input type="hidden" name="form-name" value="tisk-na-papir" />
        {/* naplní se při odeslání veřejnými odkazy na nahrané soubory (viz handleSubmit) */}
        <input type="hidden" name="Tisk-Odkazy" defaultValue="" />
        
        <div className="space-y-4">
          <div>
            <label htmlFor="edible-name" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Vaše jméno</label>
            <input id="edible-name" type="text" name="Jmeno" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
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
            <select id="edible-store" name="Prodejna" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]">
              <option value="">Vyberte prodejnu...</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť</option>
              <option value="Karviná">Karviná</option>
              <option value="Ostrava">Ostrava (Zábřeh)</option>
            </select>
          </div>

          <div>
            <label htmlFor="edible-date" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Datum vyzvednutí</label>
            <PickupDateInput id="edible-date" name="Datum" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="edible-file" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Obrázky (A4)</label>
            <div className="relative w-full p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-[#d4af37] transition-all cursor-pointer">
              <input 
                id="edible-file"
                type="file" 
                multiple 
                onChange={handleFileChange}
                required 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept="image/*,.heic,.heif,.pdf,.png,.jpg,.jpeg,.webp" 
              />
              <div className="text-sm text-slate-500">
                {files.length > 0 ? (
                  <div className="text-[#0a192f] font-medium">
                    <p className="text-xs text-slate-400 mb-1 font-bold">Vybrané soubory:</p>
                    {files.map((file, i) => <div key={i}>{file.name}</div>)}
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-700">Klikněte pro výběr obrázků nebo PDF</p>
                    <p className="text-[10px] text-slate-400 mt-1">Podporuje JPG, PNG, HEIC (iPhone), WEBP i PDF · max. {MAX_FILES} souborů, každý do {MAX_FILE_BYTES / 1024 / 1024} MB</p>
                  </div>
                )}
              </div>
            </div>
            {fileError && <p role="alert" className="mt-2 ml-2 text-xs font-bold text-red-600">{fileError}</p>}
          </div>
          <div>
            <label htmlFor="edible-note" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-2">Poznámka</label>
            <textarea id="edible-note" name="Poznamka" className="w-full p-4 h-24 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#d4af37]" placeholder="Např. ořez, nápis..."></textarea>
          </div>
        </div>

        <div className="md:col-span-2">
          {submitError && <p role="alert" className="mb-3 text-sm font-bold text-red-600 text-center">{submitError}</p>}
          <button type="submit" disabled={isSubmitting || !!fileError} className="w-full disabled:opacity-60 disabled:cursor-not-allowed bg-[#0a192f] text-white py-5 rounded-2xl font-bold hover:bg-[#d4af37] hover:text-[#0a192f] transition-all shadow-lg text-lg uppercase tracking-widest cursor-pointer">
            {isSubmitting ? 'Nahrávám soubory a odesílám…' : 'Objednat tisk'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdiblePrintForm;
