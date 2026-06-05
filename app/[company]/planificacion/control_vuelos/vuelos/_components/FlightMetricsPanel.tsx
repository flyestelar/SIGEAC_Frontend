'use client';

import { cn } from '@/lib/utils';
import { FlightControl } from '@/types';

interface FlightMetricsPanelProps {
  flight: FlightControl;
}

export function FlightMetricsPanel({ flight }: FlightMetricsPanelProps) {
  const hours = Number(flight.flight_hours ?? 0);
  const cycles = Number(flight.flight_cycles ?? 0);
  const block = computeBlockTime(flight.departure_time, flight.arrival_time);

  return (
    <section className="rounded-lg border bg-background">
      <header className="border-b px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Métricas del vuelo</h2>
      </header>
      <dl className="divide-y divide-border/60">
        <Row label="Horas registradas" value={hours.toFixed(1)} suffix="h" />
        <Row label="Ciclos" value={String(cycles)} />
        <Row label="Block time" value={block ?? '—'} muted={!block} />
      </dl>
    </section>
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
    <div className="flex items-baseline justify-between px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('flex items-baseline gap-1 font-mono tabular-nums', muted && 'text-muted-foreground')}>
        <span className="text-lg font-semibold leading-none">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </dd>
    </div>
  );
}

function computeBlockTime(dep?: string, arr?: string): string | null {
  if (!dep || !arr) return null;
  const [sh, sm] = dep.split(':').map(Number);
  const [eh, em] = arr.split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60;
  const total = end - start;
  if (total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
