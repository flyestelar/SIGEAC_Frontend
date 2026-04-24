import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    return format(parseLocalDate(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return '—';
  }
}

export function timestampEqualSecondsPrecision(ts1: string, ts2: string) {
  const date1 = new Date(ts1);
  const date2 = new Date(ts2);
  return Math.floor(date1.getTime() / 1000) === Math.floor(date2.getTime() / 1000);
}
