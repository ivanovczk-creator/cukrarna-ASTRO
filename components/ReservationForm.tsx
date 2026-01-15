
import React, { useState, useEffect } from 'react';
import { SiteData } from '../types';
import rawData from '../data.json';

const data = rawData as SiteData;

const ReservationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    store: data?.stores?.[0]?.id || '',
    date: '',
    note: ''
  });

  const [dateError, setDateError] = useState('');
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const minDateObj = new Date(today);
    minDateObj.setDate(today.getDate() + 3); // Minimálně 3 dny předem
    setMinDate(minDateObj.toISOString().split('T')[0]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'date' || name === 'store') {
      validateDate(name === 'date' ? value : formData.date, name === 'store' ? value : formData.store);
    }
  };

  const validateDate = (selectedDate: string, selectedStoreId: string) => {
    if (!selectedDate) return;
    
    const dateObj = new Date(selectedDate);
    const dayOfWeek = dateObj.getDay();
    const store = data?.stores?.find(s => s.id === selectedStoreId);

    if (store && store.closedDays.includes(dayOfWeek)) {
      const days = ['Neděli', 'Pondělí', 'Úterý', 'Středu', 'Čtvrtek', 'Pátek', 'Sobotu'];
      setDateError(`Bohužel, v ${days[dayOfWeek]} máme v pobočce ${store.city} zavřeno.`);
    } else {
      setDateError('');
    }
  };

  return (
    <section id="rezervace" className="py-24 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[4rem] p-10 md:p-20 shadow-[0_35px_100px_-15px_rgba(236,72,153,0.15)] relative overflow-hidden border border-pink-50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Udělejte si rezervaci</h2>
            <div className="mt-4 w-24 h-1.5 bg-pink-400 mx-auto rounded-full"></div>
            <p className="mt-6 text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Plánujete oslavu? Dejte nám vědět <span className="text-pink-600 font-bold underline decoration-pink-200">alespoň 3 dny předem</span>.
            </p>
          </div>

          <form action="https://formspree.io/f/xyyvveeg" method="POST" className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Vaše Jméno</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                type="text"
                placeholder="Jan Novák"
                className="w-full px-6 py-5 rounded-3xl border-none ring-1 ring-pink-100 focus:ring-2 focus:ring-pink-500 transition-all outline-none bg-pink-50/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">E-mail</label>
              <input
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                placeholder="jan@seznam.cz"
                className="w-full px-6 py-5 rounded-3xl border-none ring-1 ring-pink-100 focus:ring-2 focus:ring-pink-500 transition-all outline-none bg-pink-50/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Telefon</label>
              <input
                required
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                type="tel"
                placeholder="+420 777 666 555"
                className="w-full px-6 py-5 rounded-3xl border-none ring-1 ring-pink-100 focus:ring-2 focus:ring-pink-500 transition-all outline-none bg-pink-50/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Pobočka k vyzvednutí</label>
              <select
                required
                name="store"
                value={formData.store}
                onChange={handleInputChange}
                className="w-full px-6 py-5 rounded-3xl border-none ring-1 ring-pink-100 focus:ring-2 focus:ring-pink-500 transition-all outline-none bg-pink-50/20 appearance-none"
              >
                {data?.stores?.map(s => (
                  <option key={s.id} value={s.id}>{s.city} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Datum vyzvednutí (min +3 dny)</label>
              <input
                required
                name="date"
                min={minDate}
                value={formData.date}
                onChange={handleInputChange}
                type="date"
                className={`w-full px-6 py-5 rounded-3xl border-none ring-1 transition-all outline-none ${dateError ? 'ring-red-400 bg-red-50 text-red-600' : 'ring-pink-100 focus:ring-2 focus:ring-pink-500 bg-pink-50/20'}`}
              />
              {dateError && <p className="text-red-500 text-sm font-bold mt-2 ml-2">{dateError}</p>}
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Vaše přání / Poznámka</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={5}
                placeholder="Dort Čokoládový Sen, 1x větrník, 5x laskonka..."
                className="w-full px-6 py-5 rounded-[2rem] border-none ring-1 ring-pink-100 focus:ring-2 focus:ring-pink-500 transition-all outline-none resize-none bg-pink-50/20"
              ></textarea>
            </div>

            <div className="md:col-span-2 pt-6">
              <button
                type="submit"
                disabled={!!dateError}
                className={`w-full py-6 rounded-3xl text-white font-black text-xl shadow-2xl transition-all flex items-center justify-center space-x-3 tracking-widest uppercase ${dateError ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 hover:scale-[1.02] active:scale-95 shadow-pink-200'}`}
              >
                <span>Odeslat Rezervaci</span>
                {!dateError && <svg className="w-6 h-6 animate-bounce-x" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ReservationForm;
