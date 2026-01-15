
import React, { useState } from 'react';
import { Zakusek, CartItem } from '../types';

interface DessertCardProps {
  dessert: Zakusek;
  onAdd: (item: CartItem) => void;
}

const DessertCard: React.FC<DessertCardProps> = ({ dessert, onAdd }) => {
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    onAdd({
      id: dessert.id,
      name: dessert.nazev,
      price: dessert.cena,
      quantity: qty,
      type: 'dessert'
    });
    setQty(1);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group">
      <div className="h-48 overflow-hidden">
        <img 
          src={dessert.foto} 
          alt={dessert.nazev}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dessert.id}/400/300`;
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-[#4A3728] mb-1">{dessert.nazev}</h3>
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">{dessert.popis}</p>
        <div className="text-xl font-bold text-[#D4AF37] mb-4">{dessert.cena} Kč</div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1 hover:bg-slate-200 text-slate-500">-</button>
            <span className="px-3 py-1 font-medium text-sm w-8 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="px-3 py-1 hover:bg-slate-200 text-slate-500">+</button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-grow bg-[#E8A2AF] text-white py-2 rounded-lg font-bold text-xs hover:bg-[#db8d9c] transition-colors"
          >
            Přidat
          </button>
        </div>
      </div>
    </div>
  );
};

export default DessertCard;
