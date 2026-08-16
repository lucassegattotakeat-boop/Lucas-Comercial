import { endOfMonth, format, startOfMonth } from 'date-fns';
import type { DateRange } from '@/types';

/** Retorna o range do mês corrente no formato yyyy-MM-dd, usado como padrão em toda a aplicação. */
export function getCurrentMonthRange(referenceDate: Date = new Date()): DateRange {
  return {
    from: format(startOfMonth(referenceDate), 'yyyy-MM-dd'),
    to: format(endOfMonth(referenceDate), 'yyyy-MM-dd'),
  };
}

export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
