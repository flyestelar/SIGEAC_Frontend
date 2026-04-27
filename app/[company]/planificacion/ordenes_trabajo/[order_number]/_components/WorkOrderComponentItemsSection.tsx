'use client';

import { Badge } from '@/components/ui/badge';
import { WorkOrderComponentItemResource } from '@api/types';
import { Layers, Settings2 } from 'lucide-react';

interface WorkOrderComponentItemsSectionProps {
  items: WorkOrderComponentItemResource[];
}

export function WorkOrderComponentItemsSection({ items }: WorkOrderComponentItemsSectionProps) {
  const count = items.length;

  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Servicios Programados (Componentes)
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {count} intervalo{count !== 1 ? 's' : ''} asociado{count !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
          <Layers className="size-2.5" />
          {count}
        </Badge>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-muted-foreground">
          <Settings2 className="size-7 opacity-20" />
          <p className="text-sm">No hay component items asociados a esta orden.</p>
        </div>
      ) : (
        <div className="divide-y">
          {items.map((componentItem) => {
            const interval = componentItem.interval;

            return (
              <div key={componentItem.id} className="flex items-start gap-3 px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/20">
                  <Layers className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="break-words text-sm font-medium leading-snug">
                      {interval?.task_description ?? 'Sin descripción de intervalo'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {interval?.interval_hours != null && <span className="font-mono">FH {interval.interval_hours}</span>}
                    {interval?.interval_cycles != null && (
                      <>
                        <span className="text-border">·</span>
                        <span className="font-mono">FC {interval.interval_cycles}</span>
                      </>
                    )}
                    {interval?.interval_days != null && (
                      <>
                        <span className="text-border">·</span>
                        <span className="font-mono">DÍAS {interval.interval_days}</span>
                      </>
                    )}
                    {!interval && <span>Sin datos de intervalo</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
