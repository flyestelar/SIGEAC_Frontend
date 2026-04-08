'use client';

import { useMemo, useState } from 'react';
import { AircraftResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Clock3, Plane, RotateCcw, Search, X } from 'lucide-react';

interface AircraftHeaderProps {
  aircrafts: AircraftResource[];
  selectedAircraft: AircraftResource | null;
  onSelect: (aircraft: AircraftResource) => void;
  onClear: () => void;
}

const normalize = (value?: string | null) => (value ?? '').toLowerCase();

const AircraftHeader = ({ aircrafts, selectedAircraft, onSelect, onClear }: AircraftHeaderProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return aircrafts;
    return aircrafts.filter(
      (a) =>
        normalize(a.acronym).includes(q) ||
        normalize(a.serial).includes(q) ||
        normalize(a.manufacturer?.name).includes(q) ||
        normalize(a.aircraft_type?.full_name).includes(q),
    );
  }, [aircrafts, query]);

  if (selectedAircraft) {
    return (
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-stretch">
          {/* Compact image */}
          <div className="relative w-56 shrink-0">
            <img
              src="https://cdn.zbordirect.com/images/airlines/ES.webp"
              alt={selectedAircraft.acronym}
              className="h-full w-full object-cover brightness-[0.55] dark:brightness-[0.35]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="font-mono text-lg font-bold tracking-widest text-white drop-shadow-sm">
                  {selectedAircraft.acronym}
                </span>
                {selectedAircraft.aircraft_type?.full_name && (
                  <p className="text-[11px] text-white/70">{selectedAircraft.aircraft_type.full_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Info + telemetry */}
          <div className="flex flex-1 flex-col justify-between">
            <div className="grid grid-cols-4 gap-x-4 px-4 py-2.5">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tipo</span>
                <p className="text-sm font-medium line-clamp-1">{selectedAircraft.aircraft_type?.full_name ?? '—'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Fabricante</span>
                <p className="text-sm font-medium line-clamp-1">{selectedAircraft.manufacturer?.name ?? '—'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Serial</span>
                <p className="font-mono text-sm font-medium">{selectedAircraft.serial || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Modelo</span>
                <p className="text-sm font-medium">{selectedAircraft.model || '—'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-1.5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="size-3 shrink-0" />
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {selectedAircraft.flight_hours?.toLocaleString?.() ?? '—'}
                  </span>
                  <span>h</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RotateCcw className="size-3 shrink-0" />
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {selectedAircraft.flight_cycles?.toLocaleString?.() ?? '—'}
                  </span>
                  <span>ciclos</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={onClear}
              >
                <X className="size-3" />
                Cambiar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Picker state
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Seleccionar aeronave
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">Defina la aeronave para cargar controles aplicables.</p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acrónimo, serial…"
            className="h-8 bg-muted/20 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-muted-foreground">
            <Plane className="size-8 opacity-20" />
            <p className="text-sm">{query ? `Sin resultados para "${query}"` : 'No hay aeronaves registradas'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a)}
                className={cn(
                  'group overflow-hidden rounded-lg border bg-background text-left transition-colors duration-150',
                  'hover:border-sky-500/40 hover:bg-sky-500/5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40',
                )}
              >
                {/* Mini hero image */}
                <div className="relative">
                  <img
                    src="https://cdn.zbordirect.com/images/airlines/ES.webp"
                    alt={a.acronym}
                    className="aspect-[16/6] w-full object-cover brightness-[0.5] dark:brightness-[0.3] transition-all duration-300 group-hover:brightness-[0.7] group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 pb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 backdrop-blur-sm">
                      <Plane className="size-3 text-white" />
                    </div>
                    <span className="font-mono text-sm font-bold tracking-widest text-white">{a.acronym}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium truncate">{a.aircraft_type?.full_name ?? 'Sin tipo'}</p>
                    {a.manufacturer?.name && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {a.manufacturer.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock3 className="size-2.5" />
                      <span className="font-mono tabular-nums">{a.flight_hours?.toLocaleString?.() ?? '—'}</span> h
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="size-2.5" />
                      <span className="font-mono tabular-nums">{a.flight_cycles?.toLocaleString?.() ?? '—'}</span> cyc
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

export default AircraftHeader;
