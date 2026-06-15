'use client';

import { PlanificationAlertStatus } from '@/hooks/planificacion/useGetPlanificationAlerts';
import { cn } from '@/lib/utils';
import { PlanificationAlertResource } from '@api/types.gen';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Calendar, Clock, Gauge, Plane, ShieldCheck, Siren, TriangleAlert } from 'lucide-react';
import { AlertBadge } from '../../../control_mantenimiento/_components/control-grid-shared';
import { formatRemainingValue } from '../../_utils';

const STATUS_THEME: Record<
  PlanificationAlertStatus,
  {
    stripBg: string;
    stripBorder: string;
    accentText: string;
    iconBg: string;
    iconBorder: string;
    iconText: string;
    gaugeTrack: string;
    gaugeFill: string;
  }
> = {
  OVERDUE: {
    stripBg: 'bg-red-50 dark:bg-red-950/20',
    stripBorder: 'border-red-200 dark:border-red-800/40',
    accentText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-500/10',
    iconBorder: 'border-red-500/30',
    iconText: 'text-red-600 dark:text-red-400',
    gaugeTrack: 'bg-red-100 dark:bg-red-950/40',
    gaugeFill: 'bg-red-500',
  },
  WARNING: {
    stripBg: 'bg-amber-50 dark:bg-amber-950/20',
    stripBorder: 'border-amber-200 dark:border-amber-800/40',
    accentText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    gaugeTrack: 'bg-amber-100 dark:bg-amber-950/40',
    gaugeFill: 'bg-amber-500',
  },
  OK: {
    stripBg: 'bg-emerald-50 dark:bg-emerald-950/20',
    stripBorder: 'border-emerald-200 dark:border-emerald-800/40',
    accentText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    gaugeTrack: 'bg-emerald-100 dark:bg-emerald-950/40',
    gaugeFill: 'bg-emerald-500',
  },
};

const STATUS_CONFIG: Record<PlanificationAlertStatus, { label: string; icon: typeof TriangleAlert }> = {
  OVERDUE: { label: 'Vencido', icon: TriangleAlert },
  WARNING: { label: 'Próximo', icon: AlertTriangle },
  OK: { label: 'En tiempo', icon: ShieldCheck },
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  maintenance_control: 'Control de mantenimiento',
  hard_time: 'Hard Time',
  directive: 'Directiva de aeronavegabilidad',
};

const METRIC_LABELS: Record<string, string> = {
  CALENDAR: 'Calendario',
  FH: 'Flight Hours',
  FC: 'Flight Cycles',
};

const METRIC_ICONS: Record<string, typeof Calendar> = {
  CALENDAR: Calendar,
  FH: Clock,
  FC: Gauge,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAlertDate(value: string | null) {
  if (!value) return '—';
  return format(new Date(`${value}T00:00:00`), "d 'de' MMMM yyyy", { locale: es });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type AlertEventModalProps = {
  calendarEvent: {
    _alert: PlanificationAlertResource;
    [key: string]: unknown;
  };
};

export function AlertEventModal({ calendarEvent }: AlertEventModalProps) {
  const alert = calendarEvent._alert;
  const status = alert.status as PlanificationAlertStatus;
  const itemType = alert.item_type;
  const theme = STATUS_THEME[status];
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const metric = alert.earliest_due_metric!;
  const MetricIcon = METRIC_ICONS[metric] ?? Calendar;
  const description = alert.description as string | null;

  const earliestKey =
    alert.earliest_due_metric === 'CALENDAR'
      ? 'calendar'
      : alert.earliest_due_metric === 'FH'
        ? 'flight_hours'
        : 'flight_cycles';
  const earliestMetric = alert.metrics ? alert.metrics[earliestKey] : null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background max-w-md w-full">
      {/* ── Context strip header ── */}
      <div className={cn('flex items-center gap-2.5 border-b px-4 py-2.5', theme.stripBg, theme.stripBorder)}>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded border', theme.iconBg, theme.iconBorder)}>
          <StatusIcon className={cn('h-3.5 w-3.5', theme.iconText)} />
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.15em]', theme.accentText)}>{cfg.label}</span>
        <span className="ml-auto">
          <AlertBadge status={status} size="small" />
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-4 space-y-4">
        {/* Identifier + type */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {ITEM_TYPE_LABELS[itemType] || itemType}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Siren className="h-4 w-4 text-muted-foreground shrink-0" />
            <h3 className="text-base font-semibold truncate">{alert.item_identifier}</h3>
          </div>
        </div>

        {/* Aircraft */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Aeronave</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Plane className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{alert.aircraft?.acronym ?? 'Sin sigla'}</span>
            {alert.aircraft?.serial && (
              <span className="font-mono text-xs text-muted-foreground">S/N {alert.aircraft.serial}</span>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Descripción</p>
            <p className="text-sm text-foreground/80 mt-0.5">{description}</p>
          </div>
        )}

        {/* ── Metric card ── */}
        <div className="rounded-md border bg-muted/20 px-3.5 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MetricIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Métrica determinante
              </span>
            </div>
            <span className="text-xs font-medium">{METRIC_LABELS[metric]}</span>
          </div>

          {/* Gauge bar */}
          {earliestMetric?.progress != null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Consumido</span>
                <span className="font-mono font-medium tabular-nums">{earliestMetric.progress.toFixed(0)}%</span>
              </div>
              <div className={cn('h-1.5 rounded-full overflow-hidden', theme.gaugeTrack)}>
                <div
                  className={cn('h-full rounded-full transition-all duration-700 ease-out', theme.gaugeFill)}
                  style={{ width: `${earliestMetric.progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Restante: </span>
                  <span className="font-mono font-medium">{formatRemainingValue(alert)}</span>
                </div>
                {(() => {
                  const total = earliestMetric.total_interval ?? 0;
                  if (total <= 0) return null;
                  const unit =
                    alert.earliest_due_metric === 'CALENDAR'
                      ? 'días'
                      : alert.earliest_due_metric === 'FH'
                        ? 'FH'
                        : 'FC';
                  const formatted = Number.isInteger(total) ? total.toFixed(0) : total.toFixed(2);
                  return (
                    <div className="text-right">
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-mono font-medium">
                        {formatted} {unit}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Dates + remaining grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fecha límite</p>
              <p className="text-sm font-mono font-medium mt-0.5">{formatAlertDate(alert.earliest_due_date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
