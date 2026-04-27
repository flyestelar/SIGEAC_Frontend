'use client';

import { Badge } from '@/components/ui/badge';
import { HardTimeAlertLevel, HardTimeIntervalWithMetrics, HardTimeMetric, HardTimeMetricType } from '@/types';
import {
  AircraftComponentSlotResource,
  HardTimeInstallationResource,
  HardTimeIntervalResource,
} from '@api/types';
import { differenceInDays } from 'date-fns';
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

export function AlertBadge({ status, size = 'small' }: { status: HardTimeAlertLevel | null; size?: 'small' | 'medium' }) {
  const cfg = LEVEL_CONFIG[status ?? 'OK'];
  const sizeClasses = size === 'small' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-[11px]';
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${sizeClasses} ${cfg.badgeClass}`}>
      {ALERT_LABELS[status ?? 'OK']}
    </Badge>
  );
}

// ── Metric computation ───────────────────────────────────────────────────────

export const STATUS_ORDER: Record<HardTimeAlertLevel, number> = { OK: 0, WARNING: 1, OVERDUE: 2 };

function resolveStatus(percentage: number): HardTimeAlertLevel {
  if (percentage >= 100) return 'OVERDUE';
  if (percentage >= 80) return 'WARNING';
  return 'OK';
}

function buildMetric(
  type: HardTimeMetricType,
  consumed: number,
  interval: number,
  taskDescription: string,
): HardTimeMetric {
  const remaining = Math.max(0, interval - consumed);
  const pct = interval > 0 ? Math.round((consumed / interval) * 10000) / 100 : 0;
  return { type, consumed, interval, remaining, percentage: pct, status: resolveStatus(pct), taskDescription };
}

export function computeIntervalMetrics(
  interval: HardTimeIntervalResource,
  installation: HardTimeInstallationResource,
  aircraftFH: number,
  aircraftFC: number,
): HardTimeIntervalWithMetrics {
  const lc = interval.last_compliance;
  const today = new Date();
  const metrics: HardTimeMetric[] = [];

  if (interval.interval_hours !== null) {
    const consumed = lc
      ? Math.max(0, aircraftFH - lc.aircraft_hours_at_compliance)
      : installation.component_hours_at_install + (aircraftFH - installation.aircraft_hours_at_install);
    metrics.push(buildMetric('FH', consumed, interval.interval_hours, interval.task_description));
  }

  if (interval.interval_cycles !== null) {
    const consumed = lc
      ? Math.max(0, aircraftFC - lc.aircraft_cycles_at_compliance)
      : installation.component_cycles_at_install + (aircraftFC - installation.aircraft_cycles_at_install);
    metrics.push(buildMetric('FC', consumed, interval.interval_cycles, interval.task_description));
  }

  if (interval.interval_days !== null) {
    const baseDate = lc ? new Date(lc.compliance_date) : new Date(installation.installed_at);
    const consumed = Math.max(0, differenceInDays(today, baseDate));
    metrics.push(buildMetric('DAYS', consumed, interval.interval_days, interval.task_description));
  }

  const worstStatus = metrics.reduce<HardTimeAlertLevel>(
    (worst, m) => (STATUS_ORDER[m.status] > STATUS_ORDER[worst] ? m.status : worst),
    'OK',
  );

  return { ...interval, status: worstStatus, metrics };
}

/** Compute the overall alert level for a component slot given aircraft state. */
export function computeComponentStatus(
  component: AircraftComponentSlotResource,
  aircraftFH: number,
  aircraftFC: number,
): HardTimeAlertLevel {
  const installation = component.active_installation;
  if (!installation) return 'OK';
  const intervals = component.installed_part?.intervals ?? [];
  let worst: HardTimeAlertLevel = 'OK';
  for (const interval of intervals) {
    if (interval.is_active === false) continue;
    const enriched = computeIntervalMetrics(interval, installation, aircraftFH, aircraftFC);
    if (STATUS_ORDER[enriched.status] > STATUS_ORDER[worst]) worst = enriched.status;
  }
  return worst;
}
