
import React from 'react';

interface CakeProps {
  name: string;
  price: number;
  image: string;
  description: string;
}

export const CakeCard: React.FC<CakeProps> = ({ name, price, image, description }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-stone-100 group">
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-stone-800">{name}</h3>
          <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            {price} Kč
          </span>
        </div>
        <p className="text-stone-600 text-sm leading-relaxed">
          {description}
        </p>
        <button 
          onClick={() => document.getElementById('rezervace')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-6 w-full py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium text-sm"
        >
          Objednat
        </button>
      </div>
    </div>
  );
};
