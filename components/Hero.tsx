
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-[#fff9f9] py-16 lg:py-28 overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 hidden lg:block">
        <div className="w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="text-center lg:text-left lg:col-span-7">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-6xl md:text-7xl">
              <span className="block mb-2">Poctivá tradice</span>
              <span className="block text-pink-500 font-cursive py-2 leading-tight">Cukrářství Blahutovi</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 sm:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Ručně vyráběné dorty a zákusky z těch nejkvalitnějších surovin. 
              Již přes 20 let oslazujeme vaše nejkrásnější životní chvíle v našich prodejnách.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <a
                href="#rezervace"
                className="px-10 py-4 text-lg font-bold rounded-full text-white bg-pink-500 hover:bg-pink-600 transition-all shadow-xl shadow-pink-200 hover:scale-105 active:scale-95 text-center"
              >
                Objednat na oslavu
              </a>
              <a
                href="#prodejny"
                className="px-10 py-4 text-lg font-bold rounded-full text-pink-600 bg-white border-2 border-pink-100 hover:border-pink-500 transition-all hover:scale-105 active:scale-95 text-center"
              >
                Najít prodejnu
              </a>
            </div>
          </div>
          <div className="mt-16 lg:mt-0 lg:col-span-5">
            <div className="relative mx-auto w-full max-w-lg">
              <img
                className="w-full h-[500px] object-cover rounded-[3rem] shadow-2xl border-8 border-white"
                src="https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800"
                alt="Exkluzivní dort"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-pink-50 hidden md:block">
                <p className="font-cursive text-2xl text-pink-500">Čerstvě každý den</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
