'use client';

import { Badge } from '@/components/ui/badge';
import { HardTimeAlertLevel, HardTimeMetricType } from '@/types';
import { AlertTriangle, Calendar, Clock, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';

// ── Alert level config ────────────────────────────────────────────────────────

export const LEVEL_CONFIG: Record<
  HardTimeAlertLevel,
  {
    icon: typeof TriangleAlert;
    cardBorder: string;
    cardBg: string;
    iconBg: string;
    iconText: string;
    progressIndicator: string;
    badgeClass: string;
  }
> = {
  OVERDUE: {
    icon: TriangleAlert,
    cardBorder: 'border-l-4 border-l-red-500 border-red-500/20',
    cardBg: 'bg-red-500/5 dark:bg-red-950/20',
    iconBg: 'bg-red-500/10 border border-red-500/20',
    iconText: 'text-red-600 dark:text-red-400',
    progressIndicator: 'bg-red-500',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  WARNING: {
    icon: AlertTriangle,
    cardBorder: 'border-l-4 border-l-amber-500 border-amber-500/20',
    cardBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    iconBg: 'bg-amber-500/10 border border-amber-500/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    progressIndicator: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  OK: {
    icon: ShieldCheck,
    cardBorder: 'border-l-4 border-l-emerald-500 border-emerald-500/20',
    cardBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    progressIndicator: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  },
};

export const LEVEL_PRIORITY: Record<HardTimeAlertLevel, number> = { OVERDUE: 0, WARNING: 1, OK: 2 };

const ALERT_LABELS: Record<HardTimeAlertLevel, string> = {
  OVERDUE: 'Vencido',
  WARNING: 'Próximo',
  OK: 'En tiempo',
};

// ── Metric config ─────────────────────────────────────────────────────────────

export const METRIC_LABELS: Record<HardTimeMetricType, string> = {
  FH: 'Horas',
  FC: 'Ciclos',
  DAYS: 'Calendario',
};

export const METRIC_UNITS: Record<HardTimeMetricType, string> = {
  FH: 'FH',
  FC: 'FC',
  DAYS: 'días',
};

export const METRIC_ICONS: Record<HardTimeMetricType, typeof Clock> = {
  FH: Clock,
  FC: RefreshCw,
  DAYS: Calendar,
};

// ── Shared components ─────────────────────────────────────────────────────────

export function AlertBadge({ status, size = 'small' }: { status: HardTimeAlertLevel; size?: 'small' | 'medium' }) {
  const cfg = LEVEL_CONFIG[status];
  const sizeClasses = size === 'small' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-[11px]';
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${sizeClasses} ${cfg.badgeClass}`}>
      {ALERT_LABELS[status]}
    </Badge>
  );
}
