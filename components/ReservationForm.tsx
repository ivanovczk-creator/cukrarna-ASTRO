
import React from 'react';
import { CartItem, Branch } from '../types';

interface ReservationFormProps {
  cart: CartItem[];
  total: number;
}

const ReservationForm: React.FC<ReservationFormProps> = ({ cart, total }) => {
  const cartSummary = cart.map(i => `${i.name}${i.portions ? ` (${i.portions} porcí)` : ''} x${i.quantity}`).join(', ');

  return (
    <form 
      name="rezervace" 
      method="POST" 
      action="/podekovani"
      data-netlify="true" 
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
    >
      {/* Nutné pro Netlify Forms v Reactu */}
      <input type="hidden" name="form-name" value="rezervace" />
      <input type="hidden" name="obsah_kosiku" value={cartSummary} />
      <input type="hidden" name="celkova_cena" value={`${total} Kč`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">Jméno a příjmení *</label>
          <input 
            type="text" 
            name="jmeno" 
            required 
            placeholder="Jan Novák"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] focus:border-transparent transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Telefon *</label>
          <input 
            type="tel" 
            name="telefon" 
            required 
            placeholder="+420 777 666 555"
            autoComplete="tel"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] focus:border-transparent transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">E-mail *</label>
          <input 
            type="email" 
            name="email" 
            required 
            placeholder="jan.novak@seznam.cz"
            autoComplete="email"
            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] focus:border-transparent transition-all text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Pobočka k vyzvednutí *</label>
          <select 
            name="pobocka" 
            required 
            className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all text-base appearance-none"
          >
            <option value={Branch.Petrvald}>{Branch.Petrvald}</option>
            <option value={Branch.Karvina}>{Branch.Karvina}</option>
            <option value={Branch.Ostrava}>{Branch.Ostrava}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Datum *</label>
            <input 
              type="date" 
              name="datum" 
              required 
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Čas *</label>
            <input 
              type="time" 
              name="cas" 
              required 
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all text-base"
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 mb-2">Poznámka k objednávce</label>
        <textarea 
          name="poznamka" 
          rows={3} 
          placeholder="Alergie, text na dortu, atd."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#E8A2AF] transition-all resize-none text-base"
        ></textarea>
      </div>

      <button 
        type="submit" 
        disabled={cart.length === 0}
        className="w-full min-h-[56px] bg-[#D4AF37] hover:bg-[#c4a132] disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-gold-100 transition-all flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
      >
        Odeslat závaznou rezervaci
      </button>
      
      <p className="mt-4 text-xs text-slate-400 text-center">
        Odesláním formuláře souhlasíte se zpracováním osobních údajů. Budeme vás kontaktovat pro potvrzení dostupnosti.
      </p>
    </form>
  );
};

export default ReservationForm;
