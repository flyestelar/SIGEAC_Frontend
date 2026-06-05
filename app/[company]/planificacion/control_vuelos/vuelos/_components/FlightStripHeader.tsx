'use client';

import { cn } from '@/lib/utils';
import { FlightControl } from '@/types';
import { Plane } from 'lucide-react';
import { AIRCRAFT_TARGET } from './target-config';

interface FlightStripHeaderProps {
  flight: FlightControl;
}

export function FlightStripHeader({ flight }: FlightStripHeaderProps) {
  const t = AIRCRAFT_TARGET;
  const blockTime = computeBlockTime(flight.departure_time, flight.arrival_time);

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6 px-6 py-6">
        <Endpoint label="Origen" code={flight.origin} time={flight.departure_time} align="left" />
        <div className="flex flex-col items-center gap-1.5 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {blockTime ?? 'En ruta'}
          </span>
          <Path />
        </div>
        <Endpoint label="Destino" code={flight.destination} time={flight.arrival_time} align="right" />
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t px-6 py-2.5',
          t.stripBg,
          t.stripBorder,
        )}
      >
        <span className={cn('flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest', t.accentText)}>
          <Plane className={cn('h-3 w-3', t.iconText)} />
          {t.label}
        </span>
        <Datum label="Matrícula" value={flight.aircraft?.acronym ?? 'N/D'} mono />
        <Datum label="Vuelo" value={flight.flight_number || 'sin nº'} mono />
        <Datum label="Fecha" value={formatDate(flight.flight_date)} />
      </div>
    </div>
  );
}

interface EndpointProps {
  label: string;
  code?: string | null;
  time?: string;
  align: 'left' | 'right';
}

function Endpoint({ label, code, time, align }: EndpointProps) {
  return (
    <div className={cn('flex flex-col', align === 'right' ? 'items-end text-right' : 'items-start text-left')}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="font-mono text-5xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {code || '—'}
      </span>
      {time ? (
        <span className="mt-1.5 font-mono text-xs tabular-nums text-foreground/70">{time}</span>
      ) : (
        <span className="mt-1.5 font-mono text-xs text-muted-foreground/60">--:--</span>
      )}
    </div>
  );
}

function Path() {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground/50">
      <span className="h-px w-6 bg-current" />
      <Plane className="h-3.5 w-3.5 -rotate-45 text-muted-foreground/70" />
      <span className="h-px w-6 bg-current" />
    </div>
  );
}

interface DatumProps {
  label: string;
  value: string;
  mono?: boolean;
}

function Datum({ label, value, mono }: DatumProps) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium', mono && 'font-mono tabular-nums')}>{value}</span>
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

function formatDate(value?: string | Date | null) {
  if (!value) return 'N/D';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/D';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
}
