'use client';

import { useMemo, useState } from 'react';
import { AircraftResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Clock3, Plane, RotateCcw, Search, Waypoints, X } from 'lucide-react';

interface AircraftPickerProps {
  aircrafts: AircraftResource[];
  selectedAircraft: AircraftResource | null;
  onSelect: (aircraft: AircraftResource) => void;
  onClear: () => void;
}

const normalize = (value?: string | null) => (value ?? '').toLowerCase();

const AircraftPicker = ({ aircrafts, selectedAircraft, onSelect, onClear }: AircraftPickerProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const search = normalize(query);
    if (!search) return aircrafts;

    return aircrafts.filter(
      (aircraft) =>
        normalize(aircraft.acronym).includes(search) ||
        normalize(aircraft.serial).includes(search) ||
        normalize(aircraft.manufacturer?.name).includes(search) ||
        normalize(aircraft.aircraft_type?.full_name).includes(search),
    );
  }, [aircrafts, query]);

  if (selectedAircraft) {
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex flex-col gap-3 border-b bg-muted/20 px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Contexto de aeronave</p>
            <p className="text-sm text-muted-foreground">La mesa operativa esta filtrada por la aeronave seleccionada.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onClear}>
            <X className="size-3.5" />
            Cambiar aeronave
          </Button>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10">
              <Plane className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-semibold tracking-widest">{selectedAircraft.acronym}</span>
                {selectedAircraft.aircraft_type?.full_name && (
                  <Badge variant="outline" className="text-[10px]">
                    {selectedAircraft.aircraft_type.full_name}
                  </Badge>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {selectedAircraft.manufacturer?.name ?? 'Fabricante no disponible'} · S/N {selectedAircraft.serial ?? '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">FH</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{selectedAircraft.flight_hours ?? '-'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">FC</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{selectedAircraft.flight_cycles ?? '-'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Estado</p>
              <p className="text-sm font-semibold">Activa</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
            <Waypoints className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Preparacion de contexto</p>
            <h2 className="text-base font-semibold tracking-tight">Seleccione la aeronave</h2>
            <p className="text-sm text-muted-foreground">
              Defina la aeronave para cargar controles aplicables y construir la WO sobre su programa vigente.
            </p>
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por acronimo, serial o fabricante..."
            className="h-9 bg-muted/20 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
            <Plane className="size-8 opacity-30" />
            <p className="text-sm">{query ? `Sin resultados para "${query}"` : 'No hay aeronaves registradas'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filtered.map((aircraft) => (
              <button
                key={aircraft.id}
                type="button"
                onClick={() => onSelect(aircraft)}
                className={cn(
                  'group rounded-lg border bg-background px-4 py-4 text-left transition-colors',
                  'hover:border-sky-500/30 hover:bg-sky-500/5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded border bg-muted/30 transition-colors group-hover:border-sky-500/20 group-hover:bg-sky-500/10">
                      <Plane className="size-4 text-muted-foreground transition-colors group-hover:text-sky-600 dark:group-hover:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold tracking-widest">{aircraft.acronym}</span>
                        {aircraft.aircraft_type?.full_name && (
                          <Badge variant="outline" className="text-[10px]">
                            {aircraft.aircraft_type.full_name}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {aircraft.manufacturer?.name ?? 'Fabricante no disponible'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">Serial: {aircraft.serial ?? '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-md border bg-muted/20 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      <Clock3 className="size-3" />
                      FH
                    </div>
                    <p className="mt-1 font-mono text-xs font-semibold tabular-nums">{aircraft.flight_hours ?? '-'}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      <RotateCcw className="size-3" />
                      FC
                    </div>
                    <p className="mt-1 font-mono text-xs font-semibold tabular-nums">{aircraft.flight_cycles ?? '-'}</p>
                  </div>
                  <div className="rounded-md border bg-muted/20 px-2.5 py-2 sm:col-span-2">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Programa</p>
                    <p className="mt-1 truncate text-xs font-medium">Controles aplicables por aeronave</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AircraftPicker;
