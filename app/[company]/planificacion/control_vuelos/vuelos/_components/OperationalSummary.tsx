'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AverageMetrics {
  average_daily_flight_hours?: number;
  average_daily_flight_cycles?: number;
  flights_count?: number;
}

interface OperationalSummaryProps {
  aircraftAcronym: string;
  count: number;
  totalHours: number;
  totalCycles: number;
  averages?: AverageMetrics;
  isAveragesLoading: boolean;
  isAveragesError: boolean;
}

export function OperationalSummary({
  aircraftAcronym,
  count,
  totalHours,
  totalCycles,
  averages,
  isAveragesLoading,
  isAveragesError,
}: OperationalSummaryProps) {
  return (
    <section className="rounded-lg border bg-background">
      <header className="flex items-baseline justify-between border-b px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Matrícula</h2>
        <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
          {aircraftAcronym || '—'}
        </span>
      </header>

      <SectionLabel>Acumulado</SectionLabel>
      <dl className="divide-y divide-border/60">
        <Row
          label="Horas"
          value={totalHours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
          suffix="h"
        />
        <Row label="Ciclos" value={totalCycles.toLocaleString()} />
        <Row label="Vuelos registrados" value={String(count)} />
      </dl>

      <SectionLabel>Promedio diario</SectionLabel>
      {isAveragesLoading ? (
        <div className="flex items-center gap-2 px-4 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Calculando…
        </div>
      ) : isAveragesError ? (
        <p className="px-4 py-4 text-xs text-red-600">No se pudo calcular el promedio.</p>
      ) : (
        <dl className="divide-y divide-border/60">
          <Row label="Horas / día" value={Number(averages?.average_daily_flight_hours ?? 0).toFixed(2)} suffix="h" />
          <Row label="Ciclos / día" value={Number(averages?.average_daily_flight_cycles ?? 0).toFixed(2)} />
          <Row label="Vuelos totales" value={String(averages?.flights_count ?? 0)} />
        </dl>
      )}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b bg-muted/10 px-4 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</span>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  suffix?: string;
  muted?: boolean;
}

function Row({ label, value, suffix, muted }: RowProps) {
  return (
    <div className="flex items-baseline justify-between px-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('flex items-baseline gap-1 font-mono tabular-nums', muted && 'text-muted-foreground')}>
        <span className="text-sm font-semibold leading-none text-foreground">{value}</span>
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
      </dd>
    </div>
  );
}
