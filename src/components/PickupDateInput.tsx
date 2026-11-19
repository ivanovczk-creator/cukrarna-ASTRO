import React, { useEffect, useId, useRef } from 'react';

type PickupDateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Chybová hláška k vybranému dni (null = den je v pořádku). */
  error?: string | null;
  /** Nápověda pod polem (např. výdejní dny prodejny). */
  hint?: string;
};

/**
 * Pole pro výběr data vyzvednutí. Nativní kalendář prohlížeče neumí jednotlivé dny zneaktivnit,
 * proto neplatný den označíme červeně, zobrazíme hlášku přímo u pole a přes setCustomValidity
 * zablokujeme odeslání formuláře.
 */
const PickupDateInput = ({ error, hint, className = '', ...props }: PickupDateInputProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const messageId = useId();

  useEffect(() => {
    ref.current?.setCustomValidity(error ?? '');
  }, [error, props.value]);

  return (
    <div className="w-full">
      <input
        ref={ref}
        type="date"
        {...props}
        className={`${className}${error ? ' !border-red-500 ring-2 ring-red-200' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : props['aria-describedby']}
      />
      {error ? (
        <p id={messageId} role="alert" className="mt-2 text-xs font-bold text-red-600 leading-snug">{error}</p>
      ) : hint ? (
        <p id={messageId} className="mt-1 text-[10px] font-bold text-slate-500 leading-snug">{hint}</p>
      ) : null}
    </div>
  );
};

export default PickupDateInput;
