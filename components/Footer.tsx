
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#4A3728] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h4 className="text-[#D4AF37] font-serif text-2xl mb-4 italic">Cukrářství Blahutovi</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Rodinná tradice z Petřvaldu. Pečeme pro vás dorty, zákusky a slané občerstvení již po generace.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-slate-400">Pobočky</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><strong>Petřvald:</strong> Hlavní 123 (Po-Pá 8-17)</li>
              <li><strong>Karviná:</strong> Náměstí 45 (Út-So 9-18)</li>
              <li><strong>Ostrava:</strong> Porubská 7 (Po-Ne 10-19)</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-slate-400">Kontakt</h5>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Tel: +420 123 456 789</li>
              <li>E-mail: info@cukrarstviblahutovi.cz</li>
              <li>Sledujte nás na Instagramu</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Cukrářství Blahutovi. Všechna práva vyhrazena.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
