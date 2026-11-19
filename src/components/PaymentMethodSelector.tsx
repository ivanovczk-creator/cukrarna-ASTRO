import React from 'react';
import { PAYMENT_METHODS, formatCzk, type PaymentMethod } from '../lib/payments/config';

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** Online platba je zapnutá (PUBLIC_ONLINE_PAYMENTS) a cena košíku jde spočítat. */
  onlineAvailable: boolean;
  total: number | null;
}

/**
 * Výběr způsobu platby v objednávkovém formuláři.
 * Radio inputy mají name="Zpusob-Platby", takže hodnota odchází spolu s formulářem
 * (Netlify Forms → zpracování objednávek přes Google Workspace / Apps Script).
 */
const PaymentMethodSelector = ({ value, onChange, onlineAvailable, total }: Props) => {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
        Způsob platby
      </legend>

      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((method) => {
          const disabled = method.id === 'online' && !onlineAvailable;
          const selected = value === method.id;
          return (
            <label
              key={method.id}
              className={`p-3 rounded-xl border text-left transition-all ${
                disabled
                  ? 'opacity-50 cursor-not-allowed border-transparent bg-slate-50'
                  : selected
                    ? 'cursor-pointer border-[#d4af37] bg-[#d4af37]/10'
                    : 'cursor-pointer border-transparent bg-slate-50 hover:border-[#d4af37]/50'
              }`}
            >
              <input
                type="radio"
                name="Zpusob-Platby"
                value={method.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(method.id)}
                className="sr-only"
              />
              <span className="block text-xs font-bold leading-tight">{method.label}</span>
              <span className="block text-[10px] text-slate-500 font-bold leading-tight mt-1">
                {disabled ? 'Brzy dostupné' : method.hint}
              </span>
            </label>
          );
        })}
      </div>

      {total !== null && (
        <p className="text-right text-xs font-black text-[#735c1e]">Celkem: {formatCzk(total)}</p>
      )}
    </fieldset>
  );
};

export default PaymentMethodSelector;
