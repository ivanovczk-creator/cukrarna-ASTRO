
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="kontakt" className="bg-stone-900 text-stone-400 py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h4 className="text-white font-bold text-lg mb-4">Sladká Tečka</h4>
          <p className="text-sm leading-relaxed">
            Pečeme pro vás s láskou od roku 2015. Každý dort je originál vytvořený z poctivých surovin.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold text-lg mb-4">Otevírací doba</h4>
          <ul className="text-sm space-y-2">
            <li>Po - Pá: 8:00 - 18:00</li>
            <li>So: 9:00 - 15:00</li>
            <li>Ne: Zavřeno</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-lg mb-4">Kontakt</h4>
          <ul className="text-sm space-y-2">
            <li>Email: info@sladkatecka.cz</li>
            <li>Tel: +420 123 456 789</li>
            <li>Adresa: Hlavní 123, Ostrava</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-stone-800 text-center text-xs">
        &copy; {new Date().getFullYear()} Sladká Tečka. Všechna práva vyhrazena.
      </div>
    </footer>
  );
};
