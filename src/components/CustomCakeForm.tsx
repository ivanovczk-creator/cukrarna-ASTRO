import React, { useState } from 'react';
import PickupDateInput from './PickupDateInput';
import { getEarliestPickup, getLeadDays, getPickupDateError, getPickupHint } from '../lib/pickupRules';
import { useToday } from '../lib/useToday';
import { MAX_FILE_BYTES, validateSelection } from '../lib/printLimits';
import ConsentCheckbox from './ConsentCheckbox';
import LegalNotices from './LegalNotices';

// Nahrávání (zmenšení obrázku + upload) se stahuje až při výběru fotky / odeslání, ne při prvním vykreslení
const loadUploader = () => import('../lib/printUpload');

const CustomCakeForm = () => {
  const [selectedShop, setSelectedShop] = useState('Ostrava (Zábřeh)');
  const [pickupDate, setPickupDate] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dort na přání je vždy dort → platí výdejní dny prodejny i dny s plnou kapacitou dortů
  // Lhůta u dortu na přání zůstává 7 dní; nejdřív se spočítá nejbližší datum, pak se vyřadí blokované dny
  const today = useToday();
  const earliest = today
    ? getEarliestPickup({ store: selectedShop, includesCake: true, leadDays: getLeadDays([], { customCake: true }), today })
    : undefined;
  const dateError = getPickupDateError(pickupDate, selectedShop, true, earliest);
  const dateHint = getPickupHint(selectedShop, true, earliest);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const problem = file ? validateSelection([file]) : null;
    setPhoto(file);
    if (file) void loadUploader(); // předstažení, ať odeslání nečeká
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
        const { uploadPrintFiles } = await loadUploader();
        const [link] = await uploadPrintFiles([photo]);
        formData.set('Foto-Odkaz', link);
      }

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      if (!res.ok) throw new Error(`Server vrátil ${res.status}`);
      window.location.href = '/dekujeme/';
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Odeslání se nezdařilo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2.5rem] shadow-xl border border-blush-300 font-bold text-zinc-900">
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
            <label htmlFor="cake-shop" className="text-xs uppercase tracking-widest text-berry-700">Místo vyzvednutí</label>
            <select id="cake-shop" name="Prodejna" value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} className="w-full p-3 bg-cream rounded-xl border border-cream-300 outline-none" required>
              <option value="Ostrava (Zábřeh)">Ostrava - Zábřeh</option>
              <option value="Karviná">Karviná</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť - Sídlo firmy</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="cake-date" className="text-xs uppercase tracking-widest text-berry-700">Datum vyzvednutí</label>
            <PickupDateInput id="cake-date" name="Datum" min={earliest?.date} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} error={dateError} aria-describedby="cake-date-hint" className="w-full p-3 bg-cream rounded-xl border border-cream-300 outline-none" required />
          </div>
        </div>
        {dateHint && <p id="cake-date-hint" className="-mt-3 text-xs text-zinc-600 leading-snug">{dateHint}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label htmlFor="cake-name" className="sr-only">Vaše jméno</label>
          <input id="cake-name" type="text" name="Jmeno" autoComplete="name" placeholder="Vaše jméno" required className="p-3 bg-cream rounded-xl border border-cream-300 outline-none" />
          <label htmlFor="cake-email" className="sr-only">Váš e-mail</label>
          <input id="cake-email" type="email" name="Email" autoComplete="email" placeholder="Váš e-mail" required className="p-3 bg-cream rounded-xl border border-cream-300 outline-none" />
        </div>
        
        <label htmlFor="cake-phone" className="sr-only">Telefon</label>
        <input id="cake-phone" type="tel" name="Telefon" autoComplete="tel" placeholder="Telefon" required className="w-full p-3 bg-cream rounded-xl border border-cream-300 outline-none" />
        <label htmlFor="cake-note" className="sr-only">Popis vašeho dortu</label>
        <textarea id="cake-note" name="Poznamka" placeholder="Popište vaši představu..." required className="w-full p-3 h-32 bg-cream rounded-xl border border-cream-300 outline-none resize-none"></textarea>
        
        <div className="p-6 bg-blush-100 border-2 border-dashed border-blush-300 rounded-2xl">
          <label htmlFor="cake-photo" className="block text-xs font-bold text-berry-700 uppercase mb-3 text-center">Inspirační obrázek (nepovinné)</label>
          <input id="cake-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={handlePhotoChange} className="text-[10px] w-full" />
          <p className="mt-2 text-[10px] text-zinc-600 text-center">Jedna fotka (JPG, PNG, WEBP, HEIC), max. {MAX_FILE_BYTES / 1024 / 1024} MB</p>
          {photoError && <p role="alert" className="mt-2 text-xs font-bold text-red-600 text-center">{photoError}</p>}
        </div>

        <LegalNotices variant="custom" />
        <ConsentCheckbox id="cake-consent" />

        {submitError && <p role="alert" className="text-sm font-bold text-red-600 text-center">{submitError}</p>}
        <button type="submit" disabled={isSubmitting || !!photoError || !!dateError} className="w-full disabled:opacity-60 disabled:cursor-not-allowed bg-berry-600 text-white py-4 rounded-2xl font-bold hover:bg-berry-700 hover:text-white transition-all uppercase tracking-widest active:scale-[0.98]">
          {isSubmitting ? 'Odesílám…' : 'Odeslat poptávku'}
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
