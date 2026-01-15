
import React from 'react';
import { SiteData, Product } from '../types';
import rawData from '../data.json';

const data = rawData as SiteData;

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-pink-50 flex flex-col h-full">
    <div className="relative h-64 overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1 rounded-full font-bold text-pink-600 shadow-sm">
        {product.price} Kč
      </div>
    </div>
    <div className="p-8 flex flex-col flex-grow">
      <h3 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">{product.description}</p>
      <a href="#rezervace" className="text-pink-500 font-bold text-sm uppercase tracking-wider flex items-center group/btn">
        Rezervovat
        <svg className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  </div>
);

const ProductsSection: React.FC = () => {
  const cakes = data?.products?.filter(p => p.category === 'cake').slice(0, 4) || [];
  const pastries = data?.products?.filter(p => p.category === 'pastry').slice(0, 8) || [];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <section id="dorty" className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-4xl font-extrabold text-gray-900">Naše Dorty</h2>
              <p className="mt-4 text-gray-500 text-lg max-w-xl">
                Oslavte své životní milníky s našimi prémiovými dorty.
              </p>
            </div>
            <div className="h-1 bg-pink-100 flex-grow hidden md:block mx-8 mb-4"></div>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {cakes.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section id="zakusky">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-4xl font-extrabold text-gray-900">Sladké Zákusky</h2>
              <p className="mt-4 text-gray-500 text-lg max-w-xl">
                Dopřejte si sladkou tečku z poctivých surovin.
              </p>
            </div>
            <div className="h-1 bg-pink-100 flex-grow hidden md:block mx-8 mb-4"></div>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {pastries.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProductsSection;
