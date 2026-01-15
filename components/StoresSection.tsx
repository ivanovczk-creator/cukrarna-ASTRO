
import React from 'react';
import { SiteData } from '../types';
import rawData from '../data.json';

const data = rawData as SiteData;

const StoresSection: React.FC = () => {
  return (
    <section id="prodejny" className="py-24 bg-[#fff9f9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-gray-900">Naše prodejny</h2>
          <div className="mt-4 w-32 h-1.5 bg-pink-400 mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 text-lg max-w-2xl mx-auto">
            Najdete nás v jedné z našich 4 útulných prodejen. Těšíme se na vaši návštěvu!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {data?.stores?.map((store) => (
            <div key={store.id} className="group bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-pink-50 flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-pink-500 group-hover:rotate-6 transition-all duration-500">
                  <svg className="w-8 h-8 text-pink-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{store.city}</h3>
                <p className="text-gray-500 font-medium mb-1">{store.name}</p>
                <p className="text-gray-400 text-sm mb-6">{store.address}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {store.hours}
                  </div>
                </div>
              </div>
              <a
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-4 bg-white border-2 border-pink-100 text-pink-600 font-bold rounded-2xl hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all shadow-sm"
              >
                Otevřít v mapách
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoresSection;
