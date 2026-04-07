'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { ProjectionChart } from './projection-chart';

// ── Types ────────────────────────────────────────────────────

interface EstimationsPanelProps {
  control: MaintenanceControlResource;
  aircraft: AircraftResource | null;
}

type AlertLevel = 'OVERDUE' | 'WARNING' | 'OK';

type EstimationMetric = {
  key: 'fh' | 'fc';
  label: string;
  unit: string;
  interval: number | null;
  consumed: number | null;
  averagePerDay: number | null;
};

type ComputedEstimation = {
  remaining: number;
  percentage: number;
  daysToDue: number | null;
  estimatedDate: Date | null;
  averagePerDay: number;
  status: AlertLevel;
};

// ── Constants ────────────────────────────────────────────────

const METRIC_ICONS = { fh: Clock, fc: RefreshCw } as const;

const STATUS_CONFIG: Record<
  AlertLevel,
  {
    icon: typeof ShieldCheck;
    label: string;
    badgeClass: string;
    progressClass: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
  }
> = {
  OVERDUE: {
    icon: TriangleAlert,
    label: 'Vencido',
    badgeClass: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    progressClass: 'bg-red-500',
    accentText: 'text-red-600 dark:text-red-400',
    accentBg: 'bg-red-500/5 dark:bg-red-950/20',
    accentBorder: 'border-red-500/20',
  },
  WARNING: {
    icon: AlertTriangle,
    label: 'Próximo',
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    progressClass: 'bg-amber-500',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    accentBorder: 'border-amber-500/20',
  },
  OK: {
    icon: ShieldCheck,
    label: 'En tiempo',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    progressClass: 'bg-emerald-500',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    accentBorder: 'border-emerald-500/20',
  },
};

// ── Helpers ──────────────────────────────────────────────────

function fmt(value: number, digits = 1) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function computeEstimation(metric: EstimationMetric): ComputedEstimation | null {
  if (!metric.interval || metric.consumed === null || metric.consumed === undefined) return null;

  const remaining = Math.max(metric.interval - metric.consumed, 0);
  const percentage = Math.min((metric.consumed / metric.interval) * 100, 100);
  const averagePerDay = metric.averagePerDay ?? 0;

  let status: AlertLevel = 'OK';
  if (percentage >= 100) status = 'OVERDUE';
  else if (percentage >= 70) status = 'WARNING';

  if (remaining <= 0) {
    return { remaining, percentage, daysToDue: 0, estimatedDate: new Date(), averagePerDay, status };
  }

  if (averagePerDay <= 0) {
    return { remaining, percentage, daysToDue: null, estimatedDate: null, averagePerDay, status };
  }

  const daysToDue = Math.ceil(remaining / averagePerDay);
  return { remaining, percentage, daysToDue, estimatedDate: addDays(new Date(), daysToDue), averagePerDay, status };
}

// ── Estimation Row ───────────────────────────────────────────

function EstimationRow({ metric }: { metric: EstimationMetric }) {
  const estimation = computeEstimation(metric);
  const Icon = METRIC_ICONS[metric.key];

  if (!estimation) {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-muted/10 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/30">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{metric.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Sin intervalo configurado para esta métrica</p>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[estimation.status];
  const StatusIcon = cfg.icon;

  return (
    <Card className={`overflow-hidden border-l-4 ${cfg.accentBorder} ${cfg.accentBg}`}>
      <CardContent className="p-0">
        {/* Header strip */}
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                <Badge variant="outline" className="h-5 px-1.5 font-mono text-[10px]">
                  {metric.unit}
                </Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Intervalo: <span className="font-mono font-medium text-foreground">{fmt(metric.interval!)}</span>{' '}
                {metric.unit}
              </p>
            </div>
          </div>

          <Badge variant="outline" className={`gap-1 ${cfg.badgeClass}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>

        <Separator className="opacity-50" />

        {/* Metrics grid */}
        <div className="grid grid-cols-4 divide-x divide-border/40">
          {/* Consumed */}
          <div className="space-y-1 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Consumido</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              <span className={cfg.accentText}>{fmt(metric.consumed!)}</span>
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              de {fmt(metric.interval!)} {metric.unit}
            </p>
          </div>

          {/* Remaining */}
          <div className="space-y-1 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Restante</p>
            <p className="font-mono text-lg font-semibold tabular-nums">{fmt(estimation.remaining)}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{metric.unit} por consumir</p>
          </div>

          {/* Daily average */}
          <div className="space-y-1 px-5 py-4">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Promedio
            </p>
            {estimation.averagePerDay > 0 ? (
              <>
                <p className="font-mono text-lg font-semibold tabular-nums">{fmt(estimation.averagePerDay, 2)}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{metric.unit}/día</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground/60">—</p>
                <p className="text-[11px] text-muted-foreground/60">Sin datos</p>
              </>
            )}
          </div>

          {/* Estimated date */}
          <div className="space-y-1 px-5 py-4">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              Próx. vencimiento
            </p>
            {estimation.estimatedDate ? (
              <>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {format(estimation.estimatedDate, 'dd MMM yy', { locale: es })}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {estimation.daysToDue === 0 ? (
                    <span className={cfg.accentText}>Vencido</span>
                  ) : (
                    <>
                      en{' '}
                      <span className="font-mono font-medium text-foreground">{estimation.daysToDue}</span> día
                      {estimation.daysToDue !== 1 && 's'}
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground/60">—</p>
                <p className="text-[11px] text-muted-foreground/60">Requiere promedio diario</p>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between pb-1.5">
            <p className="text-[11px] text-muted-foreground">
              <Gauge className="mr-1 inline-block h-3 w-3" />
              Progreso de consumo
            </p>
            <p className={`font-mono text-xs font-semibold tabular-nums ${cfg.accentText}`}>
              {fmt(estimation.percentage, 0)}%
            </p>
          </div>
          <Progress value={estimation.percentage} className="h-2" indicatorClassName={cfg.progressClass} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Panel ────────────────────────────────────────────────────

export function EstimationsPanel({ control, aircraft }: EstimationsPanelProps) {
  const metrics: EstimationMetric[] = [
    {
      key: 'fh',
      label: 'Horas de vuelo',
      unit: 'FH',
      interval: control.interval_fh ?? null,
      consumed: control.since_last?.fh ?? null,
      averagePerDay: aircraft?.last_average_metric?.average_daily_flight_hours ?? null,
    },
    {
      key: 'fc',
      label: 'Ciclos de vuelo',
      unit: 'FC',
      interval: control.interval_fc ?? null,
      consumed: control.since_last?.fc ?? null,
      averagePerDay: aircraft?.last_average_metric?.average_daily_flight_cycles ?? null,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-5">
        {metrics.map((metric) => (
          <EstimationRow key={metric.key} metric={metric} />
        ))}
      </div>
      <div className="xl:col-span-7">
        <ProjectionChart metrics={metrics} />
      </div>
    </div>
  );
}
