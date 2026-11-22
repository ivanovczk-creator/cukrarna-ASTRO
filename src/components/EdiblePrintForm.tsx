import React, { useState } from 'react';
import PickupDateInput from './PickupDateInput';
import ConsentCheckbox from './ConsentCheckbox';
import LegalNotices from './LegalNotices';
import { getEarliestPickup, getLeadDays, getPickupDateError, getPickupHint } from '../lib/pickupRules';
import { useToday } from '../lib/useToday';
import { MAX_FILES, MAX_FILE_BYTES, uploadPrintFiles, validateSelection } from '../lib/printUpload';
import { BINDING_ORDER_LABEL } from '../lib/legal';
import { formatCzk } from '../lib/payments/config';

// Podklad pro jedlý tisk a jeho cena za 1 list A4 (Kč, konečná cena). Tiskneme jen na fondánový list.
const PRINT_BASE = { value: 'Fondánový list A4', price: 160 } as const;
const MAX_QTY = 50;

const fieldClass = 'w-full p-4 bg-white border border-cream-300 rounded-2xl outline-none focus:ring-2 focus:ring-berry-600';
const labelClass = 'block text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2 ml-2';

const EdiblePrintForm = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [store, setStore] = useState('');
  const [pickupDate, setPickupDate] = useState('');

  // Jedlý tisk není dort → platí jen výdejní dny vybrané prodejny (bez kalendáře plné kapacity dortů)
  // Tisk je obvykle hotový do druhého dne (termín se počítá od následujícího dne), předává se ale jen
  // jen v dny určené interním pravidlem (PRINT_PICKUP_DAYS); potom se vyřadí blokované dny (zavřeno, svátky)
  const printOptions = { print: true } as const;
  const today = useToday();
  const earliest = today
    ? getEarliestPickup({ store, includesCake: false, leadDays: getLeadDays([], printOptions), today, print: true })
    : undefined;
  const dateError = getPickupDateError(pickupDate, store, false, earliest, printOptions);
  const dateHint = getPickupHint(store, false, earliest, printOptions);

  const unitPrice = PRINT_BASE.price;
  const qtyValid = Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY;
  const total = qtyValid ? unitPrice * qty : null;

  // Soubory se nenahrávají přes Netlify Forms (jejich odkazy v e-mailu jsou za přihlášením),
  // ale přes vlastní funkci /api/upload-print → do formuláře jdou jen veřejné odkazy ke stažení.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSubmitError(null);

    if (dateError) return;

    if (total === null) {
      setSubmitError('Zadejte počet kusů (1–' + MAX_QTY + ').');
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
      formData.set('Celkem-Kc', String(total));

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    const problem = selected.length ? validateSelection(selected) : null;
    setFileError(problem);
    // nativní validace: formulář nejde odeslat s nevalidním výběrem
    e.target.setCustomValidity(problem ?? '');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 bg-cream rounded-[3rem] border border-cream-300 shadow-xl text-zinc-900">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif mb-4 italic">Tisk na fondánový list</h2>
        <p className="text-zinc-600 max-w-2xl mx-auto">
          Nahrajte své obrázky a my je vytiskneme na fondánový list A4.
        </p>
        <div className="mt-4 inline-block bg-berry-600 text-white px-6 py-2 rounded-full font-bold shadow-sm">
          Cena: {formatCzk(PRINT_BASE.price)} / list A4
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
        <input type="hidden" name="Celkem-Kc" value={total ?? ''} readOnly />
        <input type="hidden" name="Typ-Pozadavku" value="Jedlý tisk – fondánový list" readOnly />
        
        <div className="space-y-4">
          <div>
            <label htmlFor="edible-name" className={labelClass}>Vaše jméno</label>
            <input id="edible-name" type="text" name="Jmeno" required className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label htmlFor="edible-email" className={labelClass}>E-mail</label>
               <input id="edible-email" type="email" name="Email" required className={fieldClass} />
            </div>
            <div>
               <label htmlFor="edible-phone" className={labelClass}>Telefon</label>
               <input id="edible-phone" type="tel" name="Telefon" required className={fieldClass} />
            </div>
          </div>
          
          <div>
            <label htmlFor="edible-store" className={labelClass}>Místo vyzvednutí</label>
            <select id="edible-store" name="Prodejna" required value={store} onChange={(e) => setStore(e.target.value)} className={fieldClass}>
              <option value="">Vyberte prodejnu...</option>
              <option value="Petřvald">Petřvald</option>
              <option value="Píšť">Píšť</option>
              <option value="Karviná">Karviná</option>
              <option value="Ostrava (Zábřeh)">Ostrava (Zábřeh)</option>
            </select>
          </div>

          <div>
            <label htmlFor="edible-date" className={labelClass}>Datum vyzvednutí</label>
            <PickupDateInput id="edible-date" name="Datum" required min={earliest?.date} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} error={dateError} hint={dateHint} className={fieldClass} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="edible-file" className={labelClass}>Obrázky (A4)</label>
            <div className="relative w-full p-6 bg-white border-2 border-dashed border-cream-300 rounded-2xl text-center hover:border-berry-600 transition-all cursor-pointer">
              <input 
                id="edible-file"
                type="file" 
                multiple 
                onChange={handleFileChange}
                required 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                accept="image/*,.heic,.heif,.pdf,.png,.jpg,.jpeg,.webp" 
              />
              <div className="text-sm text-zinc-600">
                {files.length > 0 ? (
                  <div className="text-zinc-900 font-medium">
                    <p className="text-xs text-zinc-600 mb-1 font-bold">Vybrané soubory:</p>
                    {files.map((file, i) => <div key={i}>{file.name}</div>)}
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-zinc-700">Klikněte pro výběr obrázků nebo PDF</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Podporuje JPG, PNG, HEIC (iPhone), WEBP i PDF · max. {MAX_FILES} souborů, každý do {MAX_FILE_BYTES / 1024 / 1024} MB</p>
                  </div>
                )}
              </div>
            </div>
            {fileError && <p role="alert" className="mt-2 ml-2 text-xs font-bold text-red-600">{fileError}</p>}
          </div>
          <div>
            <label htmlFor="edible-note" className={labelClass}>Poznámka</label>
            <textarea id="edible-note" name="Poznamka" className="w-full p-4 h-24 bg-white border border-cream-300 rounded-2xl outline-none focus:ring-2 focus:ring-berry-600" placeholder="Např. ořez, nápis..."></textarea>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-white border border-cream-300 rounded-2xl p-5">
          <div className="sm:col-span-1">
            <span id="edible-base-label" className={labelClass}>Typ podkladu</span>
            <input type="hidden" name="Typ-Podkladu" value={PRINT_BASE.value} readOnly />
            <p id="edible-base" aria-labelledby="edible-base-label" className={`${fieldClass} font-bold`}>
              {PRINT_BASE.value} – {formatCzk(PRINT_BASE.price)} / ks
            </p>
          </div>
          <div>
            <label htmlFor="edible-qty" className={labelClass}>Počet kusů (listů A4)</label>
            <input
              id="edible-qty"
              type="number"
              name="Pocet-Kusu"
              required
              min={1}
              max={MAX_QTY}
              step={1}
              inputMode="numeric"
              value={Number.isNaN(qty) ? '' : qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10))}
              className={fieldClass}
            />
          </div>
          <div className="text-center sm:text-right" aria-live="polite">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Celková cena</p>
            <p className="text-2xl font-black text-berry-700">{total !== null ? formatCzk(total) : '—'}</p>
            {total !== null && (
              <p className="text-[11px] text-zinc-600 font-bold">{qty} × {formatCzk(unitPrice)}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <LegalNotices variant="print" />
          <ConsentCheckbox id="edible-consent" />
          {submitError && <p role="alert" className="text-sm font-bold text-red-600 text-center">{submitError}</p>}
          <button type="submit" disabled={isSubmitting || !!fileError || !!dateError} className="w-full disabled:opacity-60 disabled:cursor-not-allowed bg-berry-600 text-white py-5 rounded-2xl font-bold hover:bg-berry-700 hover:text-white transition-all shadow-lg text-lg uppercase tracking-widest cursor-pointer">
            {isSubmitting ? 'Nahrávám soubory a odesílám…' : BINDING_ORDER_LABEL}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EdiblePrintForm;
