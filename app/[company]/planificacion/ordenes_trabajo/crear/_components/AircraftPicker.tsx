'use client';

import { useState, useMemo } from 'react';
import { MaintenanceAircraft } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Plane, RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AircraftPickerProps {
  aircrafts: MaintenanceAircraft[];
  selectedAircraft: MaintenanceAircraft | null;
  onSelect: (aircraft: MaintenanceAircraft) => void;
  onClear: () => void;
}

const normalize = (v?: string | null) => (v ?? '').toLowerCase();

const AircraftPicker = ({ aircrafts, selectedAircraft, onSelect, onClear }: AircraftPickerProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return aircrafts;
    return aircrafts.filter(
      (a) =>
        normalize(a.acronym).includes(q) ||
        normalize(a.manufacturer?.name).includes(q) ||
        normalize(a.serial).includes(q) ||
        normalize(a.aircraft_type?.full_name).includes(q),
    );
  }, [aircrafts, query]);

  // Collapsed state — aircraft already selected
  if (selectedAircraft) {
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b bg-muted/20 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Aeronave seleccionada
          </span>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={onClear}>
            <X className="size-3" />
            Cambiar
          </Button>
        </div>
        <div className="flex items-center gap-5 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 shrink-0">
            <Plane className="size-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-semibold tracking-widest">{selectedAircraft.acronym}</span>
              {selectedAircraft.aircraft_type?.full_name && (
                <Badge variant="outline" className="font-normal text-xs">
                  {selectedAircraft.aircraft_type.full_name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedAircraft.manufacturer?.name ?? '—'} · S/N {selectedAircraft.serial || '—'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3" />
              <span className="font-mono font-medium tabular-nums text-foreground">
                {selectedAircraft.flight_hours?.toLocaleString?.() ?? '—'}
              </span>
              <span>FH</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <RotateCcw className="size-3" />
              <span className="font-mono font-medium tabular-nums text-foreground">
                {selectedAircraft.flight_cycles?.toLocaleString?.() ?? '—'}
              </span>
              <span>FC</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state — pick an aircraft
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Seleccionar aeronave
        </span>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar acrónimo, serial…"
            className="pl-9 h-8 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-muted-foreground">
            <Plane className="size-8 opacity-20" />
            <p className="text-sm">{query ? `Sin resultados para "${query}"` : 'No hay aeronaves registradas'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a)}
                className={cn(
                  'group flex items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors duration-100',
                  'hover:border-sky-500/40 hover:bg-sky-500/5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50',
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded border bg-muted/30 shrink-0 mt-0.5 group-hover:border-sky-500/20 group-hover:bg-sky-500/10 transition-colors">
                  <Plane className="size-3.5 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm font-semibold tracking-widest leading-none">{a.acronym}</span>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {a.manufacturer?.name ?? '—'} · {a.aircraft_type?.full_name ?? 'Sin tipo'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {a.flight_hours?.toLocaleString?.() ?? '—'} FH
                    </span>
                    <span className="font-mono tabular-nums">
                      {a.flight_cycles?.toLocaleString?.() ?? '—'} FC
                    </span>
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
