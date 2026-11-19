import { useEffect, useState } from 'react';
import { todayInPrague } from './pickupRules';

/**
 * Dnešní datum (Europe/Prague) – nastaví se až v prohlížeči po hydrataci. Formuláře se předrenderují při buildu,
 * takže datum spočítané už při renderu by zůstalo z doby buildu (a způsobilo by hydratační nesoulad).
 */
export function useToday(): string | undefined {
  const [today, setToday] = useState<string>();
  useEffect(() => {
    setToday(todayInPrague());
  }, []);
  return today;
}
