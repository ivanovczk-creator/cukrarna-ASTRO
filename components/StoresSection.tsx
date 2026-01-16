import React from 'react';

const StoresSection: React.FC = () => {
  const stores = [
    {
      name: "Cukrárna Petřvald",
      address: "Šenovská 1, 735 41 Petřvald",
      hours: [
        { day: "Út–Ne", time: "09:00 – 17:00" },
        { day: "Po", time: "Zavřeno" }
      ],
      tel: "778 157 857",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2572.1028373783935!2d18.39088531570958!3d49.82522717939396!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471159392c1996df%3A0x867332c9497e887!2zxaBlbm92c2vDoSAxLCA3MzUgNDEgUGV0xZl2YWxk!5e0!3m2!1scs!2scz!4v1710000000000!5m2!1scs!2scz"
    },
    {
      name: "Cukrárna Karviná",
      address: "Tř. Těreškovové 2233/28, 734 01 Karviná",
      hours: [
        { day: "Po–Pá", time: "09:00 – 17:00" },
        { day: "So", time: "08:00 – 12:00" },
        { day: "Ne", time: "Zavřeno" }
      ],
      tel: "778 157 867",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2570.623123456789!2d18.543210!3d49.854321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4711516e1a123456%3A0x1234567890abcdef!2zVMWZLiBUxJtyZcWha292b3bDqSAyMjMzLzI4LCA3MzQgMDEgS2FydmluYQ!5e0!3m2!1scs!2scz!4v1710000000000!5m2!1scs!2scz"
    },
    {
      name: "Cukrárna Ostrava",
      address: "Výškovická 116A, 700 30 Ostrava-jih",
      hours: [
        { day: "Po–Pá", time: "09:00 – 17:00" },
        { day: "So", time: "09:00 – 12:00" },
        { day: "Ne", time: "Zavřeno" }
      ],
      tel: "775 271 101",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2573.54321!2d18.24321!3d49.794321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4713f16e1a123456%3A0x1234567890abcdef!2zVsO9xaVrb3ZpY2vDoSAxMTZBLCA3MDAgMzAgT3N0cmF2YS1qaWg!5e0!3m2!1scs!2scz!4v1710000000000!5m2!1scs!2scz"
    },
    {
      name: "Výrobna Píšť",
      address: "Opavská 218/101, 747 18 Píšť",
      hours: [
        { day: "Po–Pá", time: "06:00 – 15:00" },
        { day: "So–Ne", time: "Zavřeno" }
      ],
      tel: "602 323 788",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2568.54321!2d18.19321!3d49.974321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4713e16e1a123456%3A0x1234567890abcdef!2zT3BhdnNrw6EgMjE4LzEwMSwgNzQ3IDE4IFDDrmathA!5e0!3m2!1scs!2scz!4v1710000000000!5m2!1scs!2scz"
    }
  ];

  return (
    <div className="animate-fade-in space-y-16">
      <section className="text-center">
        <h2 className="text-4xl md:text-5xl font-serif mb-6 text-[#4A3728]">Naše Prodejny</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Zastavte se za námi na kávu a čerstvý zákusek v některé z našich útulných prodejen.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {stores.map((store, i) => (
          <div key={i} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-8 flex-grow">
              <h3 className="text-2xl font-serif text-[#4A3728] mb-4 italic">{store.name}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#D4AF37] mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-slate-600 font-medium">{store.address}</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#D4AF37] mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="w-full">
                    <p className="font-bold text-[#4A3728] text-sm mb-1 uppercase tracking-wider">Otevírací doba</p>
                    <div className="space-y-1">
                      {store.hours.map((h, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-slate-50 py-1 last:border-0">
                          <span className="text-slate-500">{h.day}</span>
                          <span className="font-bold text-slate-700">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <svg className="w-5 h-5 text-[#E8A2AF] mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:+420${store.tel.replace(/\s/g, '')}`} className="text-[#E8A2AF] font-bold hover:underline">
                    +420 {store.tel}
                  </a>
                </div>
              </div>
            </div>
            <div className="h-64 w-full">
              <iframe 
                src={store.mapUrl} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title={store.name}
              ></iframe>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 text-center">
        <h3 className="text-2xl font-serif text-[#4A3728] mb-4 italic">Nenašli jste nás?</h3>
        <p className="text-slate-500 mb-8 max-w-xl mx-auto">
          Máte dotaz ohledně dostupnosti zboží nebo speciální objednávky? Neváhejte nám zavolat přímo na vaši nejbližší prodejnu.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => window.location.href = 'mailto:objednavky@cukrarstviblahutovi.cz'}
            className="px-8 py-3 bg-[#E8A2AF] text-white rounded-xl font-bold shadow-md hover:bg-[#db8d9c] transition-colors"
          >
            Napište nám e-mail
          </button>
        </div>
      </section>
    </div>
  );
};

export default StoresSection;