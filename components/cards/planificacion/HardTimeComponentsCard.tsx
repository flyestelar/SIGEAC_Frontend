'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetHardTimeComponents } from '@/hooks/planificacion/hard_time/useGetHardTimeComponents';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftResource } from '@api/types';
import { ArrowUpRight, Puzzle } from 'lucide-react';
import Link from 'next/link';

type HardTimeComponentsCardProps = {
  aircraft: AircraftResource;
};

export function HardTimeComponentsCard({ aircraft }: HardTimeComponentsCardProps) {
  const { selectedCompany } = useCompanyStore();
  const aircraftId = aircraft.id;
  const { data, isLoading } = useGetHardTimeComponents(aircraftId);
  const slots = data?.data ?? [];
  const groups = Object.groupBy(slots, (s) => s.category?.code ?? s.category_code ?? 'uncategorized');

  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted/30">
            <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Componentes Hard Time
            </p>
            <p className="truncate text-xs text-muted-foreground">Posiciones controladas de la aeronave</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isLoading && (
            <Badge variant="outline" className="text-[11px] tabular-nums">
              {slots.length} posiciones
            </Badge>
          )}
          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
            <Link href={`/${selectedCompany?.slug}/planificacion/hard_time`}>
              Ver módulo
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : slots.length ? (
        <ScrollArea className="h-[360px]">
          <div className="space-y-5 p-5">
            {Object.values(groups).map((group) => {
              if (!group?.length) return null;
              const category = group[0]?.category;
              const key = category?.code ?? group[0]?.category_code ?? 'uncategorized';

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {category?.name ?? '—'}
                      <span className="ml-2 font-mono text-[11px] font-normal">{category?.code ?? key}</span>
                    </p>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{group.length} pos.</span>
                  </div>
                  <div className="grid gap-2">
                    {group.map((component) => {
                      const {
                        aircraft_hours_at_install,
                        aircraft_cycles_at_install,
                        component_hours_at_install,
                        component_cycles_at_install,
                      } = component.active_installation ?? {};
                      const component_hours_current =
                        component_hours_at_install != null
                          ? component_hours_at_install +
                            ((aircraft.flight_hours ?? 0) - (aircraft_hours_at_install ?? 0))
                          : undefined;
                      const component_cycles_current =
                        component_cycles_at_install != null
                          ? component_cycles_at_install +
                            ((aircraft.flight_cycles ?? 0) - (aircraft_cycles_at_install ?? 0))
                          : undefined;

                      return (
                        <div
                          key={component.id}
                          className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/30"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {component.description || component.part_number}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">{component.part_number}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{component.position}</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {component.active_installation ? (
                              <div className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                <div>SN {component.active_installation.serial_number}</div>
                                <div>
                                  {component_hours_current ?? '—'} FH · {component_cycles_current ?? '—'} FC
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary" className="text-[11px]">
                                Sin instalación
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Puzzle className="h-8 w-8 opacity-20" />
          <p className="text-sm">No hay posiciones Hard Time registradas</p>
        </div>
      )}
    </section>
  );
}
