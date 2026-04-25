import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formats an ISO date string as "dd MMM yy" in Spanish locale.
 * Returns "—" for null, undefined, or invalid dates.
 */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yy', { locale: es });
}

/**
 * Formats a number with a configurable number of decimal digits.
 * Returns "—" for null, undefined, or NaN values.
 */
export function formatNumber(value?: number | null, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
