
import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, User, Phone, CheckCircle2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  blockedDays: number[];
}

interface Props {
  branches: Branch[];
}

export const ReservationForm: React.FC<Props> = ({ branches = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    branch: '',
    date: '',
    note: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Min date logic: Today + 3 days
  const minDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, []);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, branch: e.target.value, date: '' }));
    setError(null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday...
    const selectedBranch = branches.find(b => b.id === formData.branch);

    if (selectedBranch && selectedBranch.blockedDays.includes(dayOfWeek)) {
      const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
      setError(`V pobočce ${selectedBranch.name} máme v ${dayNames[dayOfWeek]} zavřeno.`);
      setFormData(prev => ({ ...prev, date: '' }));
    } else {
      setError(null);
      setFormData(prev => ({ ...prev, date: e.target.value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branch || !formData.date || !formData.name || !formData.phone) {
      setError('Prosím vyplňte všechna povinná pole.');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl text-center max-w-lg mx-auto">
        <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Rezervace přijata!</h3>
        <p className="text-stone-600 mb-6">Děkujeme za vaši objednávku. Brzy se vám ozveme pro potvrzení detailů.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="text-pink-600 font-semibold hover:underline"
        >
          Vytvořit novou rezervaci
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">Rezervační formulář</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <User size={16} className="text-stone-400" /> Jméno a příjmení
            </label>
            <input 
              required
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              placeholder="Jan Novák"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Phone size={16} className="text-stone-400" /> Telefon
            </label>
            <input 
              required
              type="tel"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              placeholder="+420 123 456 789"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        {/* Branch Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <MapPin size={16} className="text-stone-400" /> Pobočka pro vyzvednutí
          </label>
          <select 
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all bg-white"
            value={formData.branch}
            onChange={handleBranchChange}
          >
            <option value="">Vyberte pobočku...</option>
            {branches?.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Calendar size={16} className="text-stone-400" /> Datum vyzvednutí (min. za 3 dny)
          </label>
          <input 
            required
            type="date"
            min={minDateStr}
            disabled={!formData.branch}
            className={`w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all ${!formData.branch ? 'bg-stone-50 cursor-not-allowed' : 'bg-white'}`}
            value={formData.date}
            onChange={handleDateChange}
          />
          {!formData.branch && (
            <p className="text-xs text-stone-400 italic">Nejdříve prosím vyberte pobočku.</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Poznámka k objednávce</label>
          <textarea 
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all h-24 resize-none"
            placeholder="Specifikujte úpravy nebo detaily..."
            value={formData.note}
            onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
        >
          Odeslat rezervaci
        </button>
      </form>
    </div>
  );
};
