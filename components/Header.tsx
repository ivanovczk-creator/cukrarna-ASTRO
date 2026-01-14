
import React from 'react';

interface HeaderProps {
  activeTab: 'cakes' | 'desserts' | 'checkout';
  setActiveTab: (tab: 'cakes' | 'desserts' | 'checkout') => void;
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, cartCount }) => {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('cakes')}>
            <div className="w-10 h-10 bg-[#E8A2AF] rounded-full flex items-center justify-center text-white font-serif text-xl italic">B</div>
            <div>
              <h1 className="text-xl font-serif font-bold text-[#4A3728] leading-tight">Cukrářství</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Blahutovi</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <button 
              onClick={() => setActiveTab('cakes')}
              className={`pb-1 transition-all ${activeTab === 'cakes' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-slate-500 hover:text-[#4A3728]'}`}
            >
              Dorty
            </button>
            <button 
              onClick={() => setActiveTab('desserts')}
              className={`pb-1 transition-all ${activeTab === 'desserts' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-slate-500 hover:text-[#4A3728]'}`}
            >
              Zákusky
            </button>
          </nav>

          <div className="flex items-center gap-4">
             <button 
              onClick={() => setActiveTab('checkout')}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                activeTab === 'checkout' 
                ? 'bg-[#4A3728] text-white' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm font-bold">Můj výběr</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
