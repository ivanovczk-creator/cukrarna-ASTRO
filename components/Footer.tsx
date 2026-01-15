
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-pink-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <span className="font-cursive text-5xl text-pink-500">Blahutovi</span>
            <p className="mt-6 text-gray-500 text-lg max-w-md leading-relaxed">
              Tradiční rodinné cukrářství, kde se láska k řemeslu dědí z generace na generaci. Pečeme pro vás s radostí již od roku 2002.
            </p>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold uppercase tracking-widest text-sm mb-6">Navigace</h4>
            <ul className="space-y-4">
              <li><a href="#dorty" className="text-gray-500 hover:text-pink-500 transition-colors">Naše Dorty</a></li>
              <li><a href="#zakusky" className="text-gray-500 hover:text-pink-500 transition-colors">Sladké Zákusky</a></li>
              <li><a href="#prodejny" className="text-gray-500 hover:text-pink-500 transition-colors">Naše Prodejny</a></li>
              <li><a href="#rezervace" className="text-gray-500 hover:text-pink-500 transition-colors">Rezervace</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold uppercase tracking-widest text-sm mb-6">Kontakt</h4>
            <ul className="space-y-4 text-gray-500">
              <li className="flex items-center justify-center md:justify-start">
                info@cukrarstvi-blahutovi.cz
              </li>
              <li className="flex items-center justify-center md:justify-start">
                +420 739 123 456
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-12 border-t border-pink-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Cukrářství Blahutovi. S láskou upečeno v Píšti.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-pink-400 hover:text-pink-600 transition-colors">Facebook</a>
            <a href="#" className="text-pink-400 hover:text-pink-600 transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
