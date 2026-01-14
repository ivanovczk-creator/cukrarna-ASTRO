
import React, { useState } from 'react';
import { Dessert, CartItem } from '../types';

interface DessertCardProps {
  dessert: Dessert;
  onAdd: (item: CartItem) => void;
}

const DessertCard: React.FC<DessertCardProps> = ({ dessert, onAdd }) => {
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    onAdd({
      id: dessert.id,
      name: dessert.name,
      price: dessert.price,
      quantity: qty,
      type: 'dessert'
    });
    setQty(1); // Reset
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 group">
      <div className="h-48 overflow-hidden">
        <img 
          src={`https://picsum.photos/seed/${dessert.id}/400/300`} 
          alt={dessert.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-[#4A3728] mb-1">{dessert.name}</h3>
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">{dessert.description}</p>
        <div className="text-xl font-bold text-[#D4AF37] mb-4">{dessert.price} Kč</div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
            <button 
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="px-3 py-1 hover:bg-slate-200 text-slate-500"
            >-</button>
            <span className="px-3 py-1 font-medium text-sm w-8 text-center">{qty}</span>
            <button 
              onClick={() => setQty(qty + 1)}
              className="px-3 py-1 hover:bg-slate-200 text-slate-500"
            >+</button>
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
