'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AircraftAverageMetric, MaintenanceControlResource } from '@api/types';
import { AlertTriangle, Calendar, ClipboardPenLine, Clock, RefreshCw, ShieldCheck, TriangleAlert, Wrench } from 'lucide-react';
import { addDays } from 'date-fns';
import { TooltipPortal } from '@radix-ui/react-tooltip';
import Link from 'next/link';
import { useCompanyStore } from '@/stores/CompanyStore';

export type AlertLevel = 'OVERDUE' | 'WARNING' | 'OK';
export type MetricType = 'FH' | 'FC' | 'DAYS';

export type ComputedMetric = {
  type: MetricType;
  consumed: number;
  interval: number;
  remaining: number;
  percentage: number;
  status: AlertLevel;
};

export type ComputedControl = {
  control: MaintenanceControlResource;
  metrics: ComputedMetric[];
  status: AlertLevel;
};

const ALERT_LABELS: Record<AlertLevel, string> = {
  OVERDUE: 'Vencido',
  WARNING: 'Próximo',
  OK: 'En tiempo',
};

export const METRIC_LABELS: Record<MetricType, string> = {
  FH: 'Horas',
  FC: 'Ciclos',
  DAYS: 'Calendario',
};

export const METRIC_UNITS: Record<MetricType, string> = {
  FH: 'FH',
  FC: 'FC',
  DAYS: 'días',
};

export const METRIC_ICONS: Record<MetricType, typeof Clock> = {
  FH: Clock,
  FC: RefreshCw,
  DAYS: Calendar,
};

const INTERVAL_KEYS: Record<MetricType, 'interval_fh' | 'interval_fc' | 'interval_days'> = {
  FH: 'interval_fh',
  FC: 'interval_fc',
  DAYS: 'interval_days',
};

const SINCE_LAST_KEYS: Record<MetricType, 'fh' | 'fc' | 'days'> = {
  FH: 'fh',
  FC: 'fc',
  DAYS: 'days',
};

const ALL_METRIC_TYPES: MetricType[] = ['FH', 'FC', 'DAYS'];

export const LEVEL_CONFIG: Record<
  AlertLevel,
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

export const LEVEL_PRIORITY: Record<AlertLevel, number> = { OVERDUE: 0, WARNING: 1, OK: 2 };

export function EnCursoBadge({ workOrderLabel }: { workOrderLabel?: string }) {
  const { selectedCompany } = useCompanyStore()
  const badge = (
    <Link className='z-100' href={`/${selectedCompany?.slug}/planificacion/ordenes_trabajo/${workOrderLabel}`} onClick={(e) => e.stopPropagation()}>
      <Badge
        variant="outline"
        className="whitespace-nowrap h-5 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-600 dark:text-sky-400"
      >
        <Wrench className="mr-0.5 h-2.5 w-2.5" />
        En curso
      </Badge>
    </Link >
  );

  if (!workOrderLabel) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={80}>
        <TooltipTrigger asChild>
          <div>{badge}</div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className='text-muted-foreground flex gap-2 items-center'>
            <ClipboardPenLine className='size-4' /> <strong>{workOrderLabel}</strong>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider >
  );
}

export function AlertBadge({ status, size = 'small' }: { status: AlertLevel; size?: 'small' | 'medium' }) {
  const cfg = LEVEL_CONFIG[status];
  const sizeClasses = size === 'small' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-[11px]';
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${sizeClasses} ${cfg.badgeClass}`}>
      {ALERT_LABELS[status]}
    </Badge>
  );
}

export function computeMetrics(control: MaintenanceControlResource): ComputedMetric[] {
  const metrics: ComputedMetric[] = [];
  if (!control.consumed) return metrics;

  for (const type of ALL_METRIC_TYPES) {
    const interval = control[INTERVAL_KEYS[type]];
    if (interval === null || interval === undefined || interval === 0) continue;

    const consumed = control.consumed[SINCE_LAST_KEYS[type]];
    const remaining = interval - consumed;
    const percentage = Math.min((consumed / interval) * 100, 100);

    let status: AlertLevel = 'OK';
    if (percentage >= 100) status = 'OVERDUE';
    else if (percentage >= 70) status = 'WARNING';

    metrics.push({ type, consumed, interval, remaining, percentage, status });
  }

  return metrics;
}

export function worstStatus(metrics: ComputedMetric[]): AlertLevel {
  if (metrics.length === 0) return 'OK';
  return metrics.reduce<AlertLevel>(
    (worst, metric) => (LEVEL_PRIORITY[metric.status] < LEVEL_PRIORITY[worst] ? metric.status : worst),
    'OK',
  );
}

export type MetricEstimation = { date: Date; days: number; avg?: number } | null;

export function computeMetricEstimation(
  metric: ComputedMetric,
  averages: AircraftAverageMetric | null,
): MetricEstimation {
  const averageHrs = averages?.average_daily_flight_hours;
  const averageFc = averages?.average_daily_flight_cycles;
  // if (metric.remaining <= 0) {
  //   const avg = metric.type === 'FH' ? averageHrs : metric.type === 'FC' ? averageFc : undefined;

  //   return { date: new Date(), days: 0, avg };
  // }

  let days: number | null = null;
  let avg: number | undefined;

  if (metric.type === 'DAYS') {
    days = metric.remaining;
  } else if (metric.type === 'FH' && averageHrs && averageHrs > 0) {
    days = metric.remaining / averageHrs;
    avg = averageHrs;
  } else if (metric.type === 'FC' && averageFc && averageFc > 0) {
    days = metric.remaining / averageFc;
    avg = averageFc;
  }

  if (days === null || !isFinite(days)) return null;
  return { date: addDays(new Date(), Math.ceil(days)), days, avg };
}
