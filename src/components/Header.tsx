
import React from 'react';
import { Cake } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cake className="text-pink-500 w-8 h-8" />
          <span className="text-2xl font-bold tracking-tight text-stone-800">Sladká Tečka</span>
        </div>
        <nav className="hidden md:flex gap-8 font-medium text-stone-600">
          <a href="#nabidka" className="hover:text-pink-500 transition-colors">Nabídka</a>
          <a href="#rezervace" className="hover:text-pink-500 transition-colors">Rezervace</a>
          <a href="#kontakt" className="hover:text-pink-500 transition-colors">Kontakt</a>
        </nav>
      </div>
    </header>
  );
};
