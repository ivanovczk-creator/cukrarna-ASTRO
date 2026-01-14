
import React, { useState, useMemo } from 'react';
import { Cake, Dessert, CartItem } from './types';
import data from './data.json';
import CakeCard from './components/CakeCard';
import DessertCard from './components/DessertCard';
import ReservationForm from './components/ReservationForm';
import Header from './components/Header';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'cakes' | 'desserts' | 'checkout'>('cakes');

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      // For cakes, we check both ID and portions to distinguish different sizes
      const existing = prev.find(i => i.id === item.id && i.portions === item.portions);
      if (existing) {
        return prev.map(i => 
          (i.id === item.id && i.portions === item.portions) 
          ? { ...i, quantity: i.quantity + item.quantity } 
          : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  return (
    <div className="min-h-screen flex flex-col text-slate-800">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        {activeTab === 'cakes' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif mb-4 text-[#4A3728]">Naše Dorty</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Každý dort pečeme s láskou z prvotřídních surovin. Vyberte si velikost, která vám vyhovuje.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.cakes.map((cake: Cake) => (
                <CakeCard key={cake.id} cake={cake} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'desserts' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif mb-4 text-[#4A3728]">Zákusky do ruky</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Tradiční receptury, které znáte od babičky, v moderním kabátě.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.desserts.map((dessert: Dessert) => (
                <DessertCard key={dessert.id} dessert={dessert} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checkout' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif mb-8 text-[#4A3728] text-center">Dokončení rezervace</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                  <h3 className="font-bold mb-4 flex justify-between items-center">
                    Váš výběr
                    <span className="text-sm font-normal text-slate-400">({cart.length} položek)</span>
                  </h3>
                  {cart.length === 0 ? (
                    <p className="text-slate-500 italic">V košíku zatím nic není.</p>
                  ) : (
                    <ul className="space-y-4 mb-6">
                      {cart.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex-grow">
                            <span className="font-medium">{item.name}</span>
                            {item.portions && (
                              <span className="block text-xs text-slate-500">{item.portions} porcí</span>
                            )}
                            <span className="text-xs text-slate-400">{item.quantity}x {item.price} Kč</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-bold">{item.price * item.quantity} Kč</span>
                            <button 
                              onClick={() => removeFromCart(idx)}
                              className="text-pink-500 hover:text-pink-700 text-xs underline"
                            >
                              Odstranit
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>Celkem k úhradě:</span>
                    <span className="text-[#D4AF37]">{cartTotal} Kč</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <ReservationForm cart={cart} total={cartTotal} />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
