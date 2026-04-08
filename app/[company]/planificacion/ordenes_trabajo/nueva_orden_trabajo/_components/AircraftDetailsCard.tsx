'use client';

import { useState, useMemo } from 'react';
import { AircraftResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Plane, RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AircraftDetailsCardProps {
  aircrafts: AircraftResource[];
  selectedAircraft: AircraftResource | null;
  onSelect: (aircraft: AircraftResource) => void;
  onClear: () => void;
}

const InfoCell = ({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) => (
  <div className="space-y-1">
    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    <p className={cn('text-sm font-medium', mono && 'font-mono')}>{value || '—'}</p>
  </div>
);

const AircraftDetailsCard = ({ aircrafts, selectedAircraft, onSelect, onClear }: AircraftDetailsCardProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = (query ?? '').toLowerCase();
    if (!q) return aircrafts;
    return aircrafts.filter(
      (a) =>
        (a.acronym ?? '').toLowerCase().includes(q) ||
        (a.manufacturer?.name ?? '').toLowerCase().includes(q) ||
        (a.serial ?? '').toLowerCase().includes(q) ||
        (a.aircraft_type?.full_name ?? '').toLowerCase().includes(q),
    );
  }, [aircrafts, query]);

  if (selectedAircraft) {
    return (
      <div className="px-5 py-4 space-y-4">
        {/* Aircraft header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 shrink-0">
              <Plane className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-semibold tracking-widest">{selectedAircraft.acronym}</span>
                <Badge variant="outline" className="text-[10px] border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  AIRCRAFT
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{selectedAircraft.manufacturer?.name ?? '—'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={onClear}>
            <X className="size-3" />
            Cambiar
          </Button>
        </div>

        {/* Info grid — document style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 rounded-md border bg-muted/10 px-4 py-3">
          <InfoCell label="Tipo Aeronave" value={selectedAircraft.aircraft_type?.family} />
          <InfoCell label="Matrícula" value={selectedAircraft.acronym} mono />
          <InfoCell label="Modelo" value={selectedAircraft.aircraft_type?.full_name} />
          <InfoCell label="S/N" value={selectedAircraft.serial} mono />
        </div>

        {/* Flight data strip */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
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
    );
  }

  // Picker state
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Seleccionar Aeronave
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
                  <span className="font-mono tabular-nums">{a.flight_hours?.toLocaleString?.() ?? '—'} FH</span>
                  <span className="font-mono tabular-nums">{a.flight_cycles?.toLocaleString?.() ?? '—'} FC</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AircraftDetailsCard;
