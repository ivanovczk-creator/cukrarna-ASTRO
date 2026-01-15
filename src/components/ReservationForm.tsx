import React, { useState, useMemo } from 'react';
import { CartItem, Branch } from '../types';

interface ReservationFormProps {
  cart: CartItem[];
  total: number;
}

const ReservationForm: React.FC<ReservationFormProps> = ({ cart, total }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch>(Branch.Petrvald);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');

  const cartSummary = cart.map(i => `${i.name}${i.portions ? ` (${i.portions} porcí)` : ''} x${i.quantity}`).join(', ');

  const minDateString = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  }, []);

  const validateDate = (dateStr: string, branch: Branch) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Ne, 1 = Po...

    if (branch === Branch.Petrvald && day === 1) return "Pondělí: Petřvald má zavřeno.";
    if ((branch === Branch.Karvina || branch === Branch.Ostrava) && day === 0) return "Neděle: Pobočka má zavřeno.";
    if (branch === Branch.Pist && (day === 0 || day === 6)) return "Víkend: Výrobna v Píšti má zavřeno.";
    
    return null;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
    setError(validateDate(val, selectedBranch));
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Branch;
    setSelectedBranch(val);
    setError(validateDate(selectedDate, val));
  };

  return (
    <form 
      name="rezervace" 
      method="POST" 
      action="/podekovani"
      data-netlify="true" 
      className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100"
    >
      <input type="hidden" name="form-name" value="rezervace" />
      <input type="hidden" name="obsah_kosiku" value={cartSummary} />
      <input type="hidden" name="celkova_cena" value={`${total} Kč`} />
      <input type="hidden" name="email" value={customerEmail} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-700 mb-2">Jméno a příjmení *</label>
          <input type="text" name="jmeno" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#E8A2AF] outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Telefon *</label>
          <input type="tel" name="telefon" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#E8A2AF] outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">E-mail *</label>
          <input 
            type="email" 
            name="customer_email" 
            required 
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#E8A2AF] outline-none" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Pobočka k vyzvednutí *</label>
          <select name="pobocka" required value={selectedBranch} onChange={handleBranchChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none appearance-none">
            <option value={Branch.Petrvald}>{Branch.Petrvald}</option>
            <option value={Branch.Karvina}>{Branch.Karvina}</option>
            <option value={Branch.Ostrava}>{Branch.Ostrava}</option>
            <option value={Branch.Pist}>{Branch.Pist}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Datum vyzvednutí *</label>
          <input 
            type="date" 
            name="datum" 
            required 
            min={minDateString}
            value={selectedDate}
            onChange={handleDateChange}
            className={`w-full px-4 py-3 rounded-xl border outline-none ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
          />
          {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-slate-700 mb-2">Poznámka</label>
        <textarea name="poznamka" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#E8A2AF] outline-none resize-none"></textarea>
      </div>

      <button 
        type="submit" 
        disabled={cart.length === 0 || !!error}
        className="w-full bg-[#D4AF37] hover:bg-[#c4a132] disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
      >
        Odeslat rezervaci
      </button>
    </form>
  );
};

export default ReservationForm;