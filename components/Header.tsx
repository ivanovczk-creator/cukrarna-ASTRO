import React from 'react';

interface HeaderProps {
  activeTab: 'cakes' | 'desserts' | 'checkout' | 'b2b' | 'stores' | 'custom-cake';
  setActiveTab: (tab: 'cakes' | 'desserts' | 'checkout' | 'b2b' | 'stores' | 'custom-cake') => void;
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, cartCount }) => {
  const navItems: { id: HeaderProps['activeTab']; label: string }[] = [
    { id: 'cakes', label: 'Dorty' },
    { id: 'desserts', label: 'Zákusky' },
    { id: 'custom-cake', label: 'Dort na přání' },
    { id: 'stores', label: 'Prodejny' },
    { id: 'b2b', label: 'Pro firmy' },
  ];

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Horní řada: Logo a Košík */}
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('cakes')}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#E8A2AF] rounded-full flex items-center justify-center text-white font-serif text-lg md:text-xl italic shrink-0">B</div>
            <div className="block">
              <h1 className="text-lg md:text-xl font-serif font-bold text-[#4A3728] leading-tight">Cukrářství</h1>
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Blahutovi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => setActiveTab('checkout')}
              className={`relative flex items-center gap-2 px-3 md:px-5 min-h-[40px] md:min-h-[44px] rounded-full transition-all ${
                activeTab === 'checkout' 
                ? 'bg-[#4A3728] text-white' 
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs md:text-sm font-bold">Můj výběr</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Spodní řada: Navigace - flex-wrap pro mobil, aby bylo vidět všech 5 položek */}
        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 md:gap-4 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 min-h-[36px] md:min-h-[44px] rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold transition-all flex items-center justify-center ${
                activeTab === item.id 
                ? 'bg-pink-50 text-[#E8A2AF] md:bg-transparent md:text-[#D4AF37] md:border-b-2 md:border-[#D4AF37] md:rounded-none' 
                : 'text-slate-500 hover:text-[#4A3728] hover:bg-slate-50 md:hover:bg-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;