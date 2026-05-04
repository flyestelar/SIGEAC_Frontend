/* eslint-disable @next/next/no-img-element */
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AircraftResource } from '@api/types';
import { Clock, Plane, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../_data/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AircraftSelectorProps {
  aircraft: AircraftResource[];
  selectedAircraftId: number | null;
  onSelectAircraft: (id: number) => void;
}

export function AircraftSelector({ aircraft, selectedAircraftId, onSelectAircraft }: AircraftSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = aircraft.filter((ac) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ac.acronym?.toLowerCase().includes(q) ||
      ac.serial?.toLowerCase().includes(q) ||
      ac.aircraft_type?.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="p-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Plane className="h-4 w-4 text-primary" />
          Flota
          <Badge variant="secondary" className="ml-auto font-mono text-xs">
            {aircraft.length}
          </Badge>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar aeronave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/40 border-border/60"
          />
        </div>
      </CardHeader>
      <CardContent className="p-1.5 pt-0">
        <ScrollArea>
          <div className="flex gap-3 px-1 py-3">
            {filtered.map((ac) => {
              const isSelected = selectedAircraftId === ac.id;

              return (
                <AircraftItem
                  key={ac.id}
                  aircraft={ac}
                  isSelected={isSelected}
                  onSelect={() => onSelectAircraft(ac.id)}
                />
              );
            })}
            {filtered.length === 0 && (
              <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 text-center">
                <Plane className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No se encontraron aeronaves</p>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AircraftItem({
  aircraft,
  isSelected,
  onSelect,
}: {
  aircraft: AircraftResource;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group flex h-16 w-88 shrink-0 overflow-hidden rounded-lg border text-left transition-all',
        isSelected
          ? 'border-primary ring-2 ring-primary focus-visible:outline-none'
          : 'border-border/60 hover:border-foreground/20',
      )}
    >
      <div className="relative h-full w-26 shrink-0">
        <img
          src="/images/aircraft.webp"
          alt={aircraft.acronym ?? 'Aircraft'}
          className={cn(
            'h-full w-full object-cover',
            isSelected ? 'brightness-1' : 'brightness-[0.5] dark:brightness-[0.4]',
          )}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-3">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-white">{aircraft.acronym}</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between px-2 py-1.5">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <span className="truncate text-[11px] font-medium text-foreground">
              {aircraft.aircraft_type?.manufacturer?.name ?? '—'}
            </span>
            {isSelected && (
              <Badge className="h-3.5 shrink-0 bg-primary/90 px-1 text-[9px] font-semibold text-primary-foreground">
                Activa
              </Badge>
            )}
          </div>

          {aircraft.aircraft_type?.series && (
            <p className="truncate text-[10px] text-muted-foreground">
              {aircraft.aircraft_type.full_name ?? aircraft.aircraft_type.series}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 text-[10px]">
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">S/N {aircraft.serial || '—'}</span>
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-mono font-medium tabular-nums text-foreground">
              {aircraft.flight_hours?.toLocaleString() ?? 0}
            </span>
            h
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            <span className="font-mono font-medium tabular-nums text-foreground">
              {aircraft.flight_cycles?.toLocaleString() ?? 0}
            </span>
            cyc
          </span>
        </div>
      </div>
    </button>
  );
}
