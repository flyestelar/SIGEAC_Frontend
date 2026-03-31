'use client';

import { MaintenanceAircraft, MaintenanceControl } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, FileText, Loader2, Plane } from 'lucide-react';

interface SelectionSummaryProps {
  aircraft: MaintenanceAircraft;
  controls: MaintenanceControl[];
  selectedControls: Map<number, { taskCardIds: Set<number>; description: string }>;
  totalTaskCards: number;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const SelectionSummary = ({ aircraft, controls, selectedControls, totalTaskCards, onSubmit, isSubmitting }: SelectionSummaryProps) => {
  const selectedControlEntries = controls.filter((c) => selectedControls.has(c.id));

  return (
    <div className="lg:sticky lg:top-4 space-y-4">
      {/* Summary card */}
      <div className="rounded-lg border bg-background">
        <div className="border-b bg-muted/20 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen de selección
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Aircraft info */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10 shrink-0">
              <Plane className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold tracking-widest">{aircraft.acronym}</p>
              <p className="text-xs text-muted-foreground truncate">{aircraft.manufacturer?.name ?? '—'}</p>
            </div>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-muted/20 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-semibold tabular-nums">{selectedControlEntries.length}</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                Control{selectedControlEntries.length !== 1 ? 'es' : ''}
              </p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5 text-center">
              <p className="font-mono text-lg font-semibold tabular-nums">{totalTaskCards}</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                Task card{totalTaskCards !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Selected controls breakdown */}
          {selectedControlEntries.length > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Controles incluidos
              </span>
              <ScrollArea className={selectedControlEntries.length > 5 ? 'h-[200px]' : ''}>
                <div className="space-y-1.5">
                  {selectedControlEntries.map((c) => {
                    const selectedControl = selectedControls.get(c.id);
                    const count = selectedControl?.taskCardIds.size ?? 0;

                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{c.title}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{c.manual_reference}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] tabular-nums border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                        >
                          {count}/{c.task_cards.length}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-muted-foreground">
              <ClipboardList className="size-6 opacity-20" />
              <p className="text-xs text-center">Seleccione task cards de los controles disponibles</p>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t px-5 py-3">
          <Button className="w-full gap-2" disabled={totalTaskCards === 0 || isSubmitting} onClick={onSubmit}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {isSubmitting ? 'Creando…' : 'Generar Orden de Trabajo'}
          </Button>
          {totalTaskCards === 0 && (
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Seleccione al menos una task card para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionSummary;
