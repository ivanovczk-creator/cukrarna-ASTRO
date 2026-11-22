import React from 'react';
import { CONSENT_LABEL_PARTS, LEGAL_PAGES } from '../lib/legal';

interface Props {
  id: string;
  /** Odliší styl v košíku (kompaktní) a ve velkých formulářích. */
  compact?: boolean;
}

/**
 * Povinný, předem NEZAŠKRTNUTÝ souhlas s VOP a seznámení se Zásadami ochrany osobních údajů.
 * Hodnota odchází s formulářem pod názvem "Souhlas-VOP-GDPR" (= "ano"), takže je souhlas doložitelný v objednávce.
 */
const ConsentCheckbox = ({ id, compact = false }: Props) => {
  const linkClass = 'underline text-berry-700 hover:text-zinc-900 font-bold';
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 cursor-pointer text-zinc-700 font-bold leading-snug ${compact ? 'text-[11px]' : 'text-sm'}`}
    >
      <input
        id={id}
        type="checkbox"
        name="Souhlas-VOP-GDPR"
        value="ano"
        required
        defaultChecked={false}
        autoComplete="off"
        className="mt-0.5 h-4 w-4 shrink-0 accent-berry-600 cursor-pointer"
      />
      <span>
        {CONSENT_LABEL_PARTS.before}
        <a href={LEGAL_PAGES.terms} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {CONSENT_LABEL_PARTS.terms}
        </a>
        {CONSENT_LABEL_PARTS.middle}
        <a href={LEGAL_PAGES.privacy} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {CONSENT_LABEL_PARTS.privacy}
        </a>
        {CONSENT_LABEL_PARTS.after}
      </span>
    </label>
  );
};

export default ConsentCheckbox;
