import React, { useState } from 'react';

const CustomCakeForm = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-[2rem] shadow-xl border border-gold-500/20">
      <h2 className="text-3xl font-serif text-navy-900 mb-6 text-center">Dort na přání</h2>
      <p className="text-center text-slate-600 mb-8">Popište nám svou představu a my vám vytvoříme dort snů.</p>
      
      <form 
        name="dort-na-prani" 
        method="POST" 
        data-netlify="true" 
        action="/dekujeme/" 
        encType="multipart/form-data"
        className="space-y-4"
      >
        <input type="hidden" name="form-name" value="dort-na-prani" />
        
        <div>
          <label className="block text-sm font-bold mb-1">Vaše jméno</label>
          <input type="text" name="Jmeno" required className="w-full p-3 rounded-xl border border-slate-200 focus:border-gold-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">E-mail</label>
            <input type="email" name="Email" required className="w-full p-3 rounded-xl border border-slate-200 focus:border-gold-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Telefon</label>
            <input type="tel" name="Telefon" required className="w-full p-3 rounded-xl border border-slate-200 focus:border-gold-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Popis dortu (příchuť, počet osob...)</label>
          <textarea name="Popis" required className="w-full p-3 h-32 rounded-xl border border-slate-200 focus:border-gold-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gold-600">Inspirační obrázek (povinné)</label>
          <input 
            type="file" 
            name="Soubor Fotka" 
            accept="image/*" 
            required 
            className="w-full p-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-[#0a192f] text-white font-bold py-4 rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20 mt-4"
        >
          Odeslat nezávaznou poptávku
        </button>
      </form>
    </div>
  );
};

export default CustomCakeForm;
