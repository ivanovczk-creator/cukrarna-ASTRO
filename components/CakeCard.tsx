import React, { useState } from 'react';
import { Dort, CartItem } from '../types';

interface CakeCardProps {
  cake: Dort;
  onAdd: (item: CartItem) => void;
}

const CakeCard: React.FC<CakeCardProps> = ({ cake, onAdd }) => {
  const [imgSrc, setImgSrc] = useState(cake.foto);
  const [triedAlternative, setTriedAlternative] = useState(false);

  const handleImageError = () => {
    if (!triedAlternative) {
      const isJpg = imgSrc.toLowerCase().endsWith('.jpg');
      const altSrc = isJpg 
        ? imgSrc.replace(/\.jpg$/i, '.jpeg') 
        : imgSrc.replace(/\.jpeg$/i, '.jpg');
      
      setImgSrc(altSrc);
      setTriedAlternative(true);
    } else {
      setImgSrc(`https://picsum.photos/seed/cake-${cake.id}/600/400`);
    }
  };

  const handleAdd = () => {
    // Send formatted name with number and portions as requested
    onAdd({
      id: cake.id,
      name: `Dort č. ${cake.id} (${cake.porce})`,
      price: cake.cena,
      quantity: 1,
      portions: cake.porce,
      type: 'cake'
    });
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-50">
      <div className="h-64 overflow-hidden relative group">
        <img 
          src={imgSrc} 
          alt={cake.nazev}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleImageError}
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-[#4A3728] uppercase tracking-wider">
          Číslo {cake.id}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-serif mb-1 text-[#4A3728] leading-tight min-h-[3rem]">{cake.nazev}</h3>
        
        <div className="flex flex-col gap-1 mb-6">
            <span className="text-2xl font-bold text-[#D4AF37]">{cake.cena} Kč</span>
            <span className="text-sm text-slate-400 font-medium">{cake.porce}</span>
        </div>
        
        <button
          onClick={handleAdd}
          className="w-full bg-[#4A3728] text-white px-5 py-3 rounded-2xl font-bold hover:bg-[#5D4634] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
        >
          Rezervovat
        </button>
      </div>
    </div>
  );
};

export default CakeCard;