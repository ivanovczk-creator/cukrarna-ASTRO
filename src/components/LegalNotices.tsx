import React from 'react';
import {
  ALLERGENS,
  ALLERGEN_CROSS_CONTAMINATION,
  LEGAL_PAGES,
  PERISHABLE_NOTICE,
  WITHDRAWAL_NOTICE,
} from '../lib/legal';

interface Props {
  /** cart = košík (rychlá zkáza + alergeny), print = jedlý tisk, custom = dort na přání */
  variant: 'cart' | 'print' | 'custom';
}

const linkClass = 'underline text-[#735c1e] hover:text-[#0a192f]';

const AllergenList = () => (
  <details className="mt-2">
    <summary className="cursor-pointer font-bold underline text-[#735c1e] hover:text-[#0a192f]">
      Alergeny (1–14)
    </summary>
    <ol className="mt-2 space-y-0.5 list-none p-0 m-0">
      {ALLERGENS.map((a) => (
        <li key={a.n}>
          <strong>{a.n}.</strong> {a.name}
          {a.note ? <span className="text-slate-500"> ({a.note})</span> : null}
        </li>
      ))}
    </ol>
    <p className="mt-2 text-slate-600">{ALLERGEN_CROSS_CONTAMINATION}</p>
  </details>
);

/** Informační bloky před odesláním objednávky (předsmluvní informace dle občanského zákoníku). */
const LegalNotices = ({ variant }: Props) => {
  if (variant === 'cart') {
    return (
      <div className="space-y-2 text-[11px] leading-snug text-slate-700 font-bold">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p>
            <span aria-hidden="true">❄️ </span>
            {PERISHABLE_NOTICE}
          </p>
          <AllergenList />
        </div>
        <p className="bg-slate-50 rounded-xl p-3">
          <strong>Převzetí a platba:</strong> osobní odběr na zvolené prodejně (bez poplatku za dopravu), platba při
          převzetí nebo online přes Comgate. <strong>Odstoupení od smlouvy:</strong> {WITHDRAWAL_NOTICE}{' '}
          <a href={`${LEGAL_PAGES.terms}#odstoupeni`} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Více v obchodních podmínkách
          </a>
          .
        </p>
      </div>
    );
  }

  if (variant === 'print') {
    return (
      <div className="space-y-2 text-xs leading-snug text-slate-700 font-bold">
        <p className="bg-slate-50 rounded-xl p-3">
          Jedlý tisk je zboží upravené podle přání spotřebitele (§ 1837 písm. d) občanského zákoníku) – od smlouvy proto
          nelze odstoupit ve lhůtě 14 dnů.{' '}
          <a href={`${LEGAL_PAGES.terms}#odstoupeni`} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Více v obchodních podmínkách
          </a>
          . Platba proběhne při převzetí na zvolené prodejně.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p>Fondánový list může obsahovat alergeny (např. lepek, sóju, mléko, vejce).</p>
          <AllergenList />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs leading-snug text-slate-700 font-bold">
      <p className="bg-slate-50 rounded-xl p-3">
        Odesláním poptávky se nezavazujete. Smlouva vzniká až naším potvrzením objednávky včetně ceny a termínu. Dort na
        přání je zboží upravené podle přání spotřebitele a podléhá rychlé zkáze – od smlouvy nelze odstoupit ve lhůtě 14
        dnů (§ 1837 písm. d) a e) občanského zákoníku).{' '}
        <a href={`${LEGAL_PAGES.terms}#odstoupeni`} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Více v obchodních podmínkách
        </a>
        .
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p>
          <span aria-hidden="true">❄️ </span>
          {PERISHABLE_NOTICE}
        </p>
        <AllergenList />
      </div>
    </div>
  );
};

export default LegalNotices;
