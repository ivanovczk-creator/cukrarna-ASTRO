import React from 'react';

interface ThankYouProps {
  onBack: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ onBack }) => {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center animate-fade-in">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-4xl font-serif text-[#4A3728] mb-6">Děkujeme za vaši objednávku!</h2>
      
      <div className="space-y-4 text-slate-600 mb-10 leading-relaxed">
        <p className="text-lg">
          Vaši rezervaci jsme v pořádku přijali a již ji zpracováváme.
        </p>
        <p className="bg-pink-50 p-4 rounded-2xl text-sm font-medium border border-pink-100">
          Potvrzení o přijetí rezervace vám bylo zasláno na váš e-mail.
        </p>
        <p>
          Brzy vás budeme kontaktovat na uvedený telefonní nebo e-mailový kontakt pro potvrzení dostupnosti a doladění detailů.
        </p>
        <p className="font-serif italic text-xl text-[#D4AF37]">Vaši Blahutovi</p>
      </div>

      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 bg-[#4A3728] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#5D4634] transition-all shadow-lg active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Zpět na hlavní stránku
      </button>
    </div>
  );
};

export default ThankYou;