
import React, { useState } from 'react';
import { Dort, CartItem } from '../types';

interface CakeCardProps {
  cake: Dort;
  onAdd: (item: CartItem) => void;
}

const CakeCard: React.FC<CakeCardProps> = ({ cake, onAdd }) => {
  const [portions, setPortions] = useState(cake.mozne_porce[0]);
  
  const totalPrice = portions * cake.cena_za_porci;

  const handleAdd = () => {
    onAdd({
      id: cake.id,
      name: cake.nazev,
      price: totalPrice,
      quantity: 1,
      portions: portions,
      type: 'cake'
    });
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-50">
      <div className="h-64 overflow-hidden relative group">
        <img 
          src={cake.foto} 
          alt={cake.nazev}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback pro chybějící obrázek
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${cake.id}/600/400`;
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#4A3728]">
          {cake.cena_za_porci} Kč / porce
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-serif mb-2 text-[#4A3728] leading-tight min-h-[3rem]">{cake.nazev}</h3>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-bold">Počet porcí</label>
            <div className="flex gap-2 flex-wrap">
              {cake.mozne_porce.map(p => (
                <button
                  key={p}
                  onClick={() => setPortions(p)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    portions === p 
                    ? 'bg-[#E8A2AF] text-white shadow-lg shadow-pink-100' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Celková cena</span>
              <span className="text-2xl font-bold text-[#D4AF37]">{totalPrice} Kč</span>
            </div>
            <button
              onClick={handleAdd}
              className="bg-[#4A3728] text-white px-5 py-3 rounded-2xl font-bold hover:bg-[#5D4634] active:scale-95 transition-all text-sm"
            >
              Do výběru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CakeCard;
