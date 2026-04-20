'use client';

import { AircraftAverageMetric } from '@api/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, CalendarClock, Clock, Plane, RefreshCw, TrendingUp } from 'lucide-react';

interface AircraftAverageSummaryCardProps {
  averages: AircraftAverageMetric | null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy', { locale: es });
}

function formatNumber(value: number | null | undefined, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function formatInt(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString();
}

type Kpi = {
  icon: typeof Clock;
  label: string;
  value: string;
  unit: string;
  accent: 'sky' | 'emerald' | 'indigo' | 'amber';
  hint?: string;
};

const ACCENT: Record<Kpi['accent'], { iconBg: string; iconText: string }> = {
  sky: {
    iconBg: 'border-sky-500/20 bg-sky-500/10',
    iconText: 'text-sky-700 dark:text-sky-300',
  },
  emerald: {
    iconBg: 'border-emerald-500/20 bg-emerald-500/10',
    iconText: 'text-emerald-700 dark:text-emerald-300',
  },
  indigo: {
    iconBg: 'border-indigo-500/20 bg-indigo-500/10',
    iconText: 'text-indigo-700 dark:text-indigo-300',
  },
  amber: {
    iconBg: 'border-amber-500/20 bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
};

function KpiTile({ icon: Icon, label, value, unit, accent, hint }: Kpi) {
  const cfg = ACCENT[accent];
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${cfg.iconBg}`}>
        <Icon className={`h-4 w-4 ${cfg.iconText}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate">
          <span className="font-mono text-lg font-semibold leading-tight tracking-tight text-foreground">{value}</span>
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">{unit}</span>
        </p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function AircraftAverageSummaryCard({ averages }: AircraftAverageSummaryCardProps) {
  if (!averages) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Sin promedios registrados</p>
          <p className="text-xs text-muted-foreground">
            La aeronave aún no tiene métricas de horas/ciclos diarios calculadas.
          </p>
        </div>
      </div>
    );
  }

  const kpis: Kpi[] = [
    {
      icon: Clock,
      label: 'Promedio diario FH',
      value: formatNumber(averages.average_daily_flight_hours, 2),
      unit: 'FH/día',
      accent: 'sky',
      hint: 'Horas de vuelo promedio por día',
    },
    {
      icon: RefreshCw,
      label: 'Promedio diario FC',
      value: formatNumber(averages.average_daily_flight_cycles, 2),
      unit: 'FC/día',
      accent: 'indigo',
      hint: 'Ciclos promedio por día',
    },
    {
      icon: Plane,
      label: 'Vuelos en rango',
      value: formatInt(averages.flights_count),
      unit: averages.flights_count === 1 ? 'vuelo' : 'vuelos',
      accent: 'emerald',
      hint: `${formatInt(averages.days_in_range)} día${averages.days_in_range === 1 ? '' : 's'} evaluados`,
    },
    {
      icon: Activity,
      label: 'Total FH período',
      value: formatNumber(averages.total_flight_hours, 1),
      unit: 'FH',
      accent: 'sky',
    },
    {
      icon: Activity,
      label: 'Total FC período',
      value: formatInt(averages.total_flight_cycles),
      unit: 'FC',
      accent: 'indigo',
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/15 px-5 py-2.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Promedios de utilización
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          <span className="font-mono">
            {formatDate(averages.from_date)} – {formatDate(averages.to_date)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className={`${
              index >= 2 ? 'sm:border-t sm:border-border/60 sm:first-of-type:border-l-0 lg:border-t-0' : ''
            }`}
          >
            <KpiTile {...kpi} />
          </div>
        ))}
      </div>
    </div>
  );
}
