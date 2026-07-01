/* eslint-disable @next/next/no-img-element */
'use client';

import { AircraftResource } from '@api/types';
import { Command as CommandPrimitive } from 'cmdk';
import { Barcode, Check, ChevronDown, Clock, RotateCcw, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { memo, useCallback, useMemo, useState } from 'react';

interface AircraftSelectFieldProps {
  aircraft: AircraftResource[];
  selectedAircraftId: number | null;
  onSelectAircraft: (id: number) => void;
}

export const AircraftSelectField = memo(function AircraftSelectField({
  aircraft,
  selectedAircraftId,
  onSelectAircraft,
}: AircraftSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = aircraft.find((ac) => ac.id === selectedAircraftId) ?? null;

  const filtered = useMemo(
    () =>
      aircraft.filter((ac) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          ac.acronym?.toLowerCase().includes(q) ||
          ac.serial?.toLowerCase().includes(q) ||
          ac.aircraft_type?.manufacturer?.name?.toLowerCase().includes(q) ||
          ac.aircraft_type?.full_name?.toLowerCase().includes(q) ||
          ac.aircraft_type?.series?.toLowerCase().includes(q)
        );
      }),
    [aircraft, search],
  );

  const handleSelect = useCallback(
    (value: string) => {
      onSelectAircraft(Number(value));
      setOpen(false);
      setSearch('');
    },
    [onSelectAircraft],
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger className="group/trigger inline-flex h-9 w-[200px] items-center justify-between gap-2 rounded-lg border border-border/60 bg-card pr-3 text-sm outline-none transition-colors hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
        <span className="self-stretch flex items-center gap-2 truncate">
          {selected ? (
            <>
              <div className="isolate relative min-h-6 self-stretch min-w-14 shrink-0 overflow-hidden rounded-md">
                <img
                  src="/images/aircraft.webp"
                  alt={selected.acronym ?? ''}
                  className="h-full w-full object-cover absolute inset-0 -z-10"
                />
                <div className="size-full flex items-end bg-gradient-to-t from-black/60 to-transparent px-1 pb-0.5 leading-none">
                  <span className="font-mono text-[12px] font-extrabold tracking-wider text-white">
                    {selected.acronym}
                  </span>
                </div>
              </div>
              <div className="flex flex-col leading-tight text-left">
                <span className="truncate text-xs font-medium text-foreground">
                  {selected.aircraft_type?.manufacturer?.name ?? '—'}
                </span>
                {selected.aircraft_type?.series && (
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">
                    {selected.aircraft_type.full_name ?? selected.aircraft_type.series}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground ml-3">Seleccionar aeronave...</span>
          )}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-data-[state=open]/trigger:rotate-180" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <AnimatePresence>
          {open && (
            <PopoverPrimitive.Content forceMount asChild align="start" sideOffset={4}>
              <motion.div
                className="z-50 w-[320px] overflow-hidden rounded-lg border border-border/60 bg-popover text-popover-foreground shadow-lg"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <CommandPrimitive shouldFilter={false} loop>
                  <div className="flex items-center gap-2 border-b border-border/40 px-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    <CommandPrimitive.Input
                      placeholder="Buscar aeronave..."
                      value={search}
                      onValueChange={setSearch}
                      className="flex h-9 w-full bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <CommandPrimitive.List className="max-h-[260px] overflow-y-auto p-1">
                    <CommandPrimitive.Empty className="py-6 text-center text-xs text-muted-foreground">
                      No se encontraron aeronaves
                    </CommandPrimitive.Empty>
                    {filtered.map((ac) => {
                      const selected = selectedAircraftId === ac.id;
                      return (
                        <CommandPrimitive.Item
                          key={ac.id}
                          value={ac.id.toString()}
                          onSelect={handleSelect}
                          className="group/item relative flex cursor-pointer select-none gap-2.5 rounded-lg [&_*]:leading-none px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                        >
                          <div className="isolate relative h-10 min-w-14 shrink-0 border border-border/30">
                            <img
                              src="/images/aircraft.webp"
                              alt={ac.acronym ?? ''}
                              className="h-full w-full object-cover absolute inset-0 -z-10 rounded-lg"
                            />
                            <div className="size-full flex items-end bg-gradient-to-t from-black/60 rounded-lg to-transparent px-1 pb-0.5 leading-none">
                              <span className="font-mono text-[12px] font-extrabold tracking-wider text-white">
                                {ac.acronym}
                              </span>
                            </div>
                            {selected && (
                              <div className="absolute top-0 right-0 p-0.5 rounded-full z-10 flex items-center justify-center bg-green-500 translate-x-1/4 -translate-y-1/4">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 justify-between py-1">
                            <div className="flex items-center justify-start gap-2">
                              <span className="truncate text-xs font-medium text-foreground">
                                {ac.aircraft_type?.manufacturer?.name ?? '—'}
                              </span>
                              {ac.aircraft_type?.series && (
                                <span className="shrink-0 truncate text-[10px] text-muted-foreground">
                                  {ac.aircraft_type.full_name ?? ac.aircraft_type.series}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center leading-none gap-1.5 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Barcode className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                <span className="font-mono">{ac.serial || '—'}</span>
                              </span>
                              <span aria-hidden className="text-border/40">
                                ·
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                <span className="font-mono tabular-nums text-foreground">
                                  {ac.flight_hours?.toLocaleString() ?? 0}
                                </span>
                                h
                              </span>
                              <span aria-hidden className="text-border/40">
                                ·
                              </span>
                              <span className="flex items-center gap-0.5">
                                <RotateCcw className="h-2.5 w-2.5" />
                                <span className="font-mono tabular-nums text-foreground">
                                  {ac.flight_cycles?.toLocaleString() ?? 0}
                                </span>
                                cyc
                              </span>
                            </div>
                          </div>
                        </CommandPrimitive.Item>
                      );
                    })}
                  </CommandPrimitive.List>
                </CommandPrimitive>
              </motion.div>
            </PopoverPrimitive.Content>
          )}
        </AnimatePresence>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});
