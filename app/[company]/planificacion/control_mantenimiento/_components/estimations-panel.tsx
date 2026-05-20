'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Clock, Gauge, RefreshCw, TrendingUp } from 'lucide-react';
import { AlertBadge, LEVEL_CONFIG } from './control-grid-shared';
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

// ── Helpers ──────────────────────────────────────────────────

function fmt(value: number, digits = 1) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function computeEstimation(metric: EstimationMetric): ComputedEstimation | null {
  if (!metric.interval || metric.consumed == null) return null;

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
      <div className="flex h-full items-center gap-3 rounded-lg border border-border/40 bg-muted/10 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/30">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{metric.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Sin intervalo configurado para esta métrica</p>
        </div>
      </div>
    );
  }

  const cfg = LEVEL_CONFIG[estimation.status];

  return (
    <Card className={`h-full overflow-hidden rounded-xl border ${cfg.accentBorder}`}>
      <CardContent className="p-0">
        {/* Header strip */}
        <div className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  <Icon className="inline h-4 w-4 text-primary mr-1" />
                  {metric.label}
                </p>
                <Badge variant="outline" className="h-4.5 px-1.5 font-mono text-xs">
                  {fmt(metric.interval!)} {metric.unit}
                </Badge>
              </div>
            </div>
          </div>

          <AlertBadge status={estimation.status} />
        </div>

        <Separator className="opacity-50" />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border/40">
          {/* Consumed */}
          <div className="space-y-1 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Consumido</p>
            <p className="font-mono text-base font-semibold tabular-nums">
              <span className={cfg.accentText}>{fmt(metric.consumed!)}</span>
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              de {fmt(metric.interval!)} {metric.unit}
            </p>
          </div>

          {/* Remaining */}
          <div className="space-y-1 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Restante</p>
            <p className="font-mono text-base font-semibold tabular-nums">{fmt(estimation.remaining)}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{metric.unit} por consumir</p>
          </div>

          {/* Daily average */}
          <div className="space-y-1 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Promedio
            </p>
            {estimation.averagePerDay > 0 ? (
              <>
                <p className="font-mono text-base font-semibold tabular-nums">
                  {fmt(estimation.averagePerDay, 2)}{' '}
                  <span className="font-mono text-[11px] text-muted-foreground">{metric.unit}/día</span>
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">Sin datos</p>
            )}
          </div>

          {/* Estimated date */}
          <div className="space-y-1 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              Próx. vencimiento
            </p>
            {estimation.estimatedDate ? (
              <>
                <p className="font-mono text-base font-semibold tabular-nums">
                  {format(estimation.estimatedDate, 'dd MMM yy', { locale: es })}{' '}
                  <span className="text-[11px] text-muted-foreground">
                    &mdash;{' '}
                    {estimation.daysToDue === 0 ? (
                      <span className={cfg.accentText}>Vencido</span>
                    ) : (
                      <>
                        en <span className="font-mono font-medium text-foreground">{estimation.daysToDue}</span> día
                        {estimation.daysToDue !== 1 && 's'}
                      </>
                    )}
                  </span>
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
        <div className="px-3 pb-2.5">
          <div className="flex items-center justify-between pb-1">
            <p className="text-[11px] text-muted-foreground">
              <Gauge className="mr-1 inline-block h-3 w-3" />
              Progreso de consumo
            </p>
            <p className={`font-mono text-xs font-semibold tabular-nums ${cfg.accentText}`}>
              {fmt(estimation.percentage, 0)}%
            </p>
          </div>
          <Progress value={estimation.percentage} className="h-1.5" indicatorClassName={cfg.progressIndicator} />
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
      consumed: control.consumed?.fh ?? null,
      averagePerDay: aircraft?.last_average_metric?.average_daily_flight_hours ?? null,
    },
    {
      key: 'fc',
      label: 'Ciclos de vuelo',
      unit: 'FC',
      interval: control.interval_fc ?? null,
      consumed: control.consumed?.fc ?? null,
      averagePerDay: aircraft?.last_average_metric?.average_daily_flight_cycles ?? null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 flex-col md:flex-row">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex-1">
            <EstimationRow key={metric.key} metric={metric} />
          </div>
        ))}
      </div>
      <div>
        <ProjectionChart metrics={metrics} />
      </div>
    </div>
  );
}
