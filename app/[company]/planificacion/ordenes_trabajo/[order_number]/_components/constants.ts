/* ─── Constants ─── */

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  APROBADO: {
    label: 'Aprobado',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  ABIERTO: {
    label: 'Abierto',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  CERRADO: {
    label: 'Cerrado',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
  PENDIENTE: {
    label: 'Pendiente',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  RECHAZADO: {
    label: 'Rechazado',
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

const fallbackStatus = { label: 'Sin estado', className: 'border-border bg-muted/20 text-muted-foreground' };

export function getStatusConfig(statusRaw: string | null | undefined) {
  statusRaw = statusRaw?.toUpperCase() || '';
  return STATUS_CONFIG[statusRaw] ?? fallbackStatus;
}
