'use client';

import { MaintenanceControlResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ClipboardList, FileCheck2, Loader2, ShieldCheck, Wrench } from 'lucide-react';

interface SelectionSummaryProps {
  controls: MaintenanceControlResource[];
  selectedControls: Map<number, { taskCardIds: Set<number> }>;
  totalTaskCards: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const SelectionSummary = ({
  controls,
  selectedControls,
  totalTaskCards,
  onSubmit,
  isSubmitting,
  onCancel,
}: SelectionSummaryProps) => {
  const selectedControlEntries = controls
    .filter((c) => selectedControls.has(c.id))
    .map((c) => ({ control: c, item: selectedControls.get(c.id)! }));

  const readinessLabel = totalTaskCards === 0 ? 'Sin selección' : 'Listo para crear';

  const readinessTone =
    totalTaskCards === 0
      ? 'border-border bg-muted/20 text-muted-foreground'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

  return (
    <div className="lg:sticky lg:top-4 space-y-4">
      <div className="rounded-lg border bg-background">
        <div className="border-b px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen de selección
          </p>
        </div>

        <div className="space-y-4 p-4">
          {/* Counters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Controles</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{selectedControlEntries.length}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Task cards</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{totalTaskCards}</p>
            </div>
          </div>

          {/* Readiness */}
          <div className={cn('flex items-center gap-2 rounded-md border px-3 py-2', readinessTone)}>
            <ShieldCheck className="size-3.5 shrink-0" />
            <p className="text-xs font-semibold">{readinessLabel}</p>
          </div>

          {/* Selected controls list */}
          {selectedControlEntries.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Controles incluidos
                </p>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {selectedControlEntries.length}
                </Badge>
              </div>

              <ScrollArea className="h-[280px] rounded-md border">
                <div className="space-y-1.5 p-2">
                  {selectedControlEntries.map(({ control, item }) => {
                    const selectedCount = item.taskCardIds.size;
                    const totalCount = (control.task_cards ?? []).filter((tc) => tc.applicable).length;
                    const isComplete = selectedCount > 0 && selectedCount === totalCount;

                    return (
                      <div key={control.id} className="rounded-md border bg-background px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{control.title}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {control.manual_reference ?? 'Sin ref.'}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[10px] tabular-nums',
                              isComplete
                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {selectedCount}/{totalCount}
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5">
                          {(control.consumed?.fh || control.consumed?.fc || control.consumed?.days) && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              <Wrench className="size-2.5" />
                              Consumo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-8 text-center text-muted-foreground">
              <ClipboardList className="size-6 opacity-30" />
              <p className="text-xs">Seleccione controles y task cards para ver el resumen.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t px-4 py-3">
          <Button className="w-full gap-2" disabled={totalTaskCards === 0 || isSubmitting} onClick={onSubmit}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
            {isSubmitting ? 'Creando…' : 'Crear Orden de Trabajo'}
          </Button>
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectionSummary;
