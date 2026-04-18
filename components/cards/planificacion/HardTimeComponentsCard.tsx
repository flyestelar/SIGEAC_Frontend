'use client';

import { useGetHardTimeComponents } from '@/hooks/planificacion/hard_time/useGetHardTimeComponents';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Puzzle } from 'lucide-react';

type HardTimeComponentsCardProps = {
  aircraftId: number | null;
};

export function HardTimeComponentsCard({ aircraftId }: HardTimeComponentsCardProps) {
  const { data, isLoading } = useGetHardTimeComponents(aircraftId);
  const groups = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Puzzle className="h-4 w-4" /> Componentes (Hard Time)
        </CardTitle>
        <CardDescription className="text-xs">Posiciones controladas del aeronave</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[360px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2 rounded-md border p-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.category.code} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                    <span>
                      {group.category.name}{' '}
                      <span className="ml-2 font-mono text-[11px]">{group.category.code}</span>
                    </span>
                    <Badge variant="outline" className="text-[11px]">
                      {group.components.length} posiciones
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {group.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex items-center justify-between gap-3 rounded-md border p-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{component.description || component.part_number}</span>
                            <span className="font-mono text-xs text-muted-foreground">{component.part_number}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{component.position}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {component.active_installation ? (
                            <div className="text-right text-xs text-muted-foreground">
                              <div>
                                SN: <span className="font-mono">{component.active_installation.serial_number}</span>
                              </div>
                              <div>FH: {component.active_installation.component_hours_current ?? '—'}</div>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-[11px]">
                              Sin instalación
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Puzzle className="size-8 opacity-20" />
              <p className="text-sm">No hay posiciones Hard Time registradas</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
