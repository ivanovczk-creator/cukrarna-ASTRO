import React, { useState } from 'react';
import PickupDateInput from './PickupDateInput';
import { getPickupDateError, getPickupHint } from '../lib/pickupRules';
import { MAX_FILE_BYTES, uploadPrintFiles, validateSelection } from '../lib/printUpload';
import ConsentCheckbox from './ConsentCheckbox';
import LegalNotices from './LegalNotices';

// Výpočet minimálního data mimo hlavní render (šetří výkon)
const getInitialMinDate = () => {
  const dt = new Date();
  dt.setDate(dt.getDate() + 7);
  return dt.toISOString().split('T')[0];
};

const CustomCakeForm = () => {
  const [selectedShop, setSelectedShop] = useState('Ostrava (Zábřeh)');
  const [pickupDate, setPickupDate] = useState('');
  const [minDate] = useState(getInitialMinDate()); // Stačí nastavit jednou při startu
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dort na přání je vždy dort → platí výdejní dny prodejny i dny s plnou kapacitou dortů
  const dateError = getPickupDateError(pickupDate, selectedShop, true);
  const dateHint = getPickupHint(selectedShop, true);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const problem = file ? validateSelection([file]) : null;
    setPhoto(file);
    setPhotoError(problem);
    e.target.setCustomValidity(problem ?? '');
  };

  // Obrázek se nenahrává přes Netlify Forms (odkaz v e-mailu je za přihlášením),
  // ale přes /api/upload-print – do formuláře jde jen jeden veřejný odkaz ke stažení.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSubmitError(null);

    if (dateError) return;

    setIsSubmitting(true);
    try {
      if (photo) {
        const [link] = await uploadPrintFiles([photo]);
        formData.set('Foto-Odkaz', link);
      }

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

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-[#d4af37]/10 font-bold text-[#0a192f]">
      <h2 className="text-3xl font-serif mb-4 text-center italic">Konfigurátor dortu</h2>
      
      <form 
        name="dort-na-prani-v2" 
        method="POST" 
        data-netlify="true" 
        onSubmit={handleSubmit}
        className="space-y-6 flex flex-col"
      >
        <input type="hidden" name="form-name" value="dort-na-prani-v2" />
        <input type="hidden" name="Typ-Pozadavku" value="Dort na přání" />
        {/* naplní se při odeslání veřejným odkazem na nahraný obrázek (viz handleSubmit) */}
        <input type="hidden" name="Foto-Odkaz" defaultValue="" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-[#735c1e]">Místo vyzvednutí</label>
            <select name="Prodejna" value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" required>
              <option value="Ostrava (Zábřeh)">Ostrava - Zábřeh</option>
              <option value="Karviná">Karviná - Ráj</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť - Sídlo firmy</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-widest text-[#735c1e]">Datum vyzvednutí</label>
            <PickupDateInput name="Datum" min={minDate} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} error={dateError} hint={dateHint} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="Jmeno" placeholder="Vaše jméno" required className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
          <input type="email" name="Email" placeholder="Váš e-mail" required className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
        </div>
        
        <input type="tel" name="Telefon" placeholder="Telefon" required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
        <textarea name="Poznamka" placeholder="Popište vaši představu..." required className="w-full p-3 h-32 bg-slate-50 rounded-xl border border-slate-200 outline-none resize-none"></textarea>
        
        <div className="p-6 bg-orange-50 border-2 border-dashed border-[#b38f2d]/30 rounded-2xl">
          <label htmlFor="cake-photo" className="block text-xs font-bold text-[#735c1e] uppercase mb-3 text-center">Inspirační obrázek (nepovinné)</label>
          <input id="cake-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={handlePhotoChange} className="text-[10px] w-full" />
          <p className="mt-2 text-[10px] text-slate-500 text-center">Jedna fotka (JPG, PNG, WEBP, HEIC), max. {MAX_FILE_BYTES / 1024 / 1024} MB</p>
          {photoError && <p role="alert" className="mt-2 text-xs font-bold text-red-600 text-center">{photoError}</p>}
        </div>

        <LegalNotices variant="custom" />
        <ConsentCheckbox id="cake-consent" />

        {submitError && <p role="alert" className="text-sm font-bold text-red-600 text-center">{submitError}</p>}
        <button type="submit" disabled={isSubmitting || !!photoError || !!dateError} className="w-full disabled:opacity-60 disabled:cursor-not-allowed bg-[#0a192f] text-white py-4 rounded-2xl font-bold hover:bg-[#d4af37] transition-all uppercase tracking-widest active:scale-[0.98]">
          {isSubmitting ? 'Odesílám…' : 'Odeslat poptávku'}
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
