import React from 'react';

const B2BSection: React.FC = () => {
  const benefits = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Denní rozvoz",
      text: "Zajišťujeme pravidelné závozy v dohodnuté dny, včetně víkendů."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: "Vlastní sortiment",
      text: "Možnost přizpůsobit výběr zákusků podle preferencí vašich hostů."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Ranní hodiny",
      text: "Spolehlivé dodávky čerstvého zboží ještě před otevřením provozovny."
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      ),
      title: "Výhodné ceny",
      text: "Speciální velkoobchodní ceník pro naše stálé B2B partnery."
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="text-center mb-16 py-12 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="inline-block p-3 bg-pink-50 rounded-2xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#E8A2AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <h2 className="text-4xl md:text-5xl font-serif mb-6 text-[#4A3728]">Pro firmy a kavárny</h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Zákusky pro firmy – pravidelný rozvoz pro kavárny, obchody a kanceláře.
          Nabízíme poctivou ruční výrobu a spolehlivost rodinné cukrárny.
        </p>
      </section>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {benefits.map((b, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
            <div className="mb-4">{b.icon}</div>
            <h3 className="text-lg font-bold text-[#4A3728] mb-2">{b.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </div>

      {/* Delivery Section */}
      <section className="bg-[#4A3728] text-white rounded-[2.5rem] p-8 md:p-16 mb-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-serif text-[#D4AF37] mb-6 italic">Kam rozvážíme?</h3>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Okres Ostrava', 'Okres Karviná', 'Hlučínsko'].map(area => (
                <span key={area} className="px-4 py-2 bg-white/10 rounded-full text-sm font-bold border border-white/20">
                  {area}
                </span>
              ))}
            </div>
            <p className="text-slate-300 leading-relaxed">
              Podle dohody zajišťujeme i rozvoz do okolních obcí a pravidelné závozy v dohodnuté dny. 
              Rádi přizpůsobíme sortiment i frekvenci dodávek potřebám vaší firmy.
            </p>
          </div>
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
            <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#E8A2AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Máte zájem o spolupráci?
            </h4>
            <p className="text-sm text-slate-300 mb-8">
              Napište nám nezávaznou poptávku a my se vám ozveme s nabídkou a ceníkem pro firmy.
            </p>
            <a 
              href="mailto:objednavky@cukrarstviblahutovi.cz?subject=Poptávka spolupráce - [Firma]"
              className="inline-block w-full text-center bg-[#D4AF37] hover:bg-[#C4A132] text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Napište nám e-mail
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default B2BSection;