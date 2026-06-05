'use client';

import { cn } from '@/lib/utils';
import { FlightControl } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { Plane } from 'lucide-react';
import { DataTable } from '../data-table';

interface FlightsListCardProps {
  flights: FlightControl[];
  columns: ColumnDef<FlightControl>[];
  aircraftAcronym: string;
}

export function FlightsListCard({ flights, columns, aircraftAcronym }: FlightsListCardProps) {
  return (
    <section className="rounded-lg border bg-background">
      <header className="flex items-baseline justify-between border-b px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Operaciones</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {flights.length} vuelos · {aircraftAcronym || '—'}
        </span>
      </header>
      <div className="p-4">
        {flights.length ? <DataTable columns={columns} data={flights} /> : <EmptyState acronym={aircraftAcronym} />}
      </div>
    </section>
  );
}

function EmptyState({ acronym }: { acronym: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center gap-3',
        'rounded-md border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center',
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded border bg-background text-muted-foreground/70">
        <Plane className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">Sin operaciones registradas</p>
        <p className="text-xs text-muted-foreground">
          Los vuelos para <span className="font-mono">{acronym || 'esta matrícula'}</span> aparecerán aquí.
        </p>
      </div>
    </div>
  );
}
