import React, { useState, useMemo, useEffect } from 'react';
import { Dort, Zakusek, CartItem } from '../types';
import data from '../data.json';
import CakeCard from './CakeCard';
import DessertCard from './DessertCard';
import ReservationForm from './ReservationForm';
import ThankYou from './ThankYou';
import Header from './Header';
import Footer from './Footer';
import B2BSection from './B2BSection';
import StoresSection from './StoresSection';
import CustomCakeForm from './CustomCakeForm';

type Tab = 'cakes' | 'desserts' | 'checkout' | 'podekovani' | 'b2b' | 'stores' | 'custom-cake';

const MainApp: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('cakes');

  const sortedCakes = useMemo(() => {
    return [...(data.cakes as Dort[])].sort((a, b) => (a.weight ?? 100) - (b.weight ?? 100));
  }, []);

  const sortedDesserts = useMemo(() => {
    return [...(data.desserts as Zakusek[])].sort((a, b) => (a.weight ?? 100) - (b.weight ?? 100));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/podekovani') {
      setActiveTab('podekovani');
      setCart([]);
    }
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
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

  const handleBackToMain = () => {
    window.history.pushState({}, '', '/');
    setActiveTab('cakes');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  return (
    <div className="min-h-screen flex flex-col">
      {activeTab !== 'podekovani' && (
        <Header 
          activeTab={activeTab as any} 
          setActiveTab={setActiveTab as any} 
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        />
      )}

      <main className="flex-grow container mx-auto px-4 py-8">
        {activeTab === 'cakes' && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif mb-4 text-[#4A3728]">Naše Dorty</h2>
              <p className="text-slate-600 max-w-2xl mx-auto px-4">
                Vyberte si z {sortedCakes.length} druhů dortů. Každý pečený s maximální péčí.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedCakes.map((cake: Dort) => (
                <CakeCard key={cake.id} cake={cake} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'desserts' && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif mb-4 text-[#4A3728]">Zákusky do ruky</h2>
              <p className="text-slate-600 max-w-2xl mx-auto px-4">
                Tradiční receptury v moderním kabátě.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedDesserts.map((dessert: Zakusek) => (
                <DessertCard key={dessert.id} dessert={dessert} onAdd={addToCart} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'custom-cake' && <CustomCakeForm />}
        {activeTab === 'stores' && <StoresSection />}
        {activeTab === 'b2b' && <B2BSection />}

        {activeTab === 'checkout' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-serif mb-8 text-[#4A3728] text-center">Dokončení rezervace</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-24">
                  <h3 className="font-bold mb-4 flex justify-between items-center">Váš výběr</h3>
                  {cart.length === 0 ? (
                    <div className="text-center py-6 italic text-slate-500">V košíku nic není.</div>
                  ) : (
                    <ul className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                      {cart.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm">
                          <div className="flex-grow">
                            <span className="font-medium block leading-tight">{item.name}</span>
                            {item.portions && <span className="text-xs text-slate-500">{item.portions} porcí</span>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="font-bold block">{item.price * item.quantity} Kč</span>
                            <button onClick={() => removeFromCart(idx)} className="text-pink-500 text-xs">Odebrat</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>Celkem:</span>
                    <span className="text-[#D4AF37]">{cartTotal} Kč</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3 order-1 lg:order-2">
                <ReservationForm cart={cart} total={cartTotal} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'podekovani' && <ThankYou onBack={handleBackToMain} />}
      </main>

      <Footer />
    </div>
  );
};

export default MainApp;