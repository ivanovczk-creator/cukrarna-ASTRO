import blockedDatesFile from '../data/blocked-dates.json';

type BlockedDatesFile = {
  dates?: Array<{ date?: string }>;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const BLOCKED_DATE_MESSAGE =
  'Omlouváme se, ale vybraný termín je vyprodaný. Prosím zvolte jiné datum.';

export function getBlockedDates(): string[] {
  const entries = (blockedDatesFile as BlockedDatesFile).dates ?? [];

  return entries
    .map((entry) => String(entry?.date ?? '').slice(0, 10))
    .filter((date) => DATE_PATTERN.test(date));
}

const blockedDateSet = new Set(getBlockedDates());

export function isBlockedDate(value: string): boolean {
  return blockedDateSet.has(value);
}
