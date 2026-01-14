
import React, { useState } from 'react';
import { Cake, CartItem } from '../types';

interface CakeCardProps {
  cake: Cake;
  onAdd: (item: CartItem) => void;
}

const CakeCard: React.FC<CakeCardProps> = ({ cake, onAdd }) => {
  const [portions, setPortions] = useState(cake.availablePortions[0]);
  
  const totalPrice = portions * cake.pricePerServing;

  const handleAdd = () => {
    onAdd({
      id: cake.id,
      name: cake.name,
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
          src={`https://picsum.photos/seed/${cake.id}/600/400`} 
          alt={cake.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#4A3728]">
          {cake.pricePerServing} Kč / porce
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-serif mb-2 text-[#4A3728]">{cake.name}</h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2">{cake.description}</p>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-bold">Počet porcí</label>
            <div className="flex gap-2 flex-wrap">
              {cake.availablePortions.map(p => (
                <button
                  key={p}
                  onClick={() => setPortions(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
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
              className="bg-[#4A3728] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#5D4634] active:scale-95 transition-all text-sm"
            >
              Přidat do výběru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CakeCard;
