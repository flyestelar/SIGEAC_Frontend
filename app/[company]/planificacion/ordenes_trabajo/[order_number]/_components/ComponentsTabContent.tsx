'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WorkOrderComponentItemResource } from '@api/types';
import { Layers, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ComponentsTabContentProps {
  items: WorkOrderComponentItemResource[];
}

export function ComponentsTabContent({ items }: ComponentsTabContentProps) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const interval = item.interval;
      if (interval?.task_description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [items, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar componentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-9 pr-4 text-sm"
          />
        </div>
        <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
          <Layers className="size-2.5" />
          {filteredItems.length}
        </Badge>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-muted-foreground">
          <Layers className="size-7 opacity-20" />
          <p className="text-sm">
            {search
              ? 'No se encontraron componentes con ese término de búsqueda.'
              : 'No hay intervalos asociados a esta orden.'}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredItems.map((componentItem) => {
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
                    {interval?.interval_hours != null && (
                      <span className="font-mono">FH {interval.interval_hours}</span>
                    )}
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
    </div>
  );
}
