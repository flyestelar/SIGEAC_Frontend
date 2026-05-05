'use client';

import {
  AircraftComponentSlotResource,
  AirworthinessDirectiveResource,
  HardTimeIntervalResource,
  MaintenanceControlResource,
} from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ClipboardList, FileCheck2, Loader2, MapPinned, ShieldAlert, ShieldCheck, Wrench } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { WorkOrderFormValues } from './WorkOrderCreator';

interface SelectionSummaryProps {
  controls: MaintenanceControlResource[];
  selectedControls: Map<number, { taskCardIds: Set<number> }>;
  totalTaskCards: number;
  hardTimeIntervalDirectory: Map<number, { interval: HardTimeIntervalResource; slot: AircraftComponentSlotResource }>;
  selectedHardTimeIntervals: Set<number>;
  directives: AirworthinessDirectiveResource[];
  onSubmit: () => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const SelectionSummary = ({
  controls,
  selectedControls,
  totalTaskCards,
  hardTimeIntervalDirectory,
  selectedHardTimeIntervals,
  directives,
  onSubmit,
  isSubmitting,
  onCancel,
}: SelectionSummaryProps) => {
  const { control } = useFormContext<WorkOrderFormValues>();
  const selectedDirectiveIdss = useWatch({
    control,
    name: 'directive_ids',
  });
  const selectedDirectiveIds = new Set(selectedDirectiveIdss);
  const selectedControlEntries = controls
    .filter((c) => selectedControls.has(c.id))
    .map((c) => ({ control: c, item: selectedControls.get(c.id)! }));

  const selectedHardTimeEntries = Array.from(selectedHardTimeIntervals)
    .map((id) => hardTimeIntervalDirectory.get(id))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);

  const selectedDirectiveEntries = directives.filter((d) => selectedDirectiveIds.has(d.id));

  const totalSelected = totalTaskCards + selectedHardTimeEntries.length + selectedDirectiveEntries.length;

  const readinessLabel = totalSelected === 0 ? 'Sin selección' : 'Listo para crear';

  const readinessTone =
    totalSelected === 0
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
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Mant.</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{totalTaskCards}</p>
              <p className="text-[10px] text-muted-foreground">
                {selectedControlEntries.length} ctrl{selectedControlEntries.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">H. Time</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{selectedHardTimeEntries.length}</p>
              <p className="text-[10px] text-muted-foreground">intervalo(s)</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AD</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{selectedDirectiveEntries.length}</p>
              <p className="text-[10px] text-muted-foreground">directiva(s)</p>
            </div>
          </div>

          {/* Readiness */}
          <div className={cn('flex items-center gap-2 rounded-md border px-3 py-2', readinessTone)}>
            <ShieldCheck className="size-3.5 shrink-0" />
            <p className="text-xs font-semibold">{readinessLabel}</p>
          </div>

          {/* Selected items list */}
          {totalSelected > 0 ? (
            <ScrollArea className="h-[320px] rounded-md border">
              <div className="space-y-3 p-2">
                {selectedControlEntries.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Wrench className="size-3" />
                        Mantenimiento
                      </p>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {selectedControlEntries.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedHardTimeEntries.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <ShieldAlert className="size-3" />
                        Hard Time
                      </p>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {selectedHardTimeEntries.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {selectedHardTimeEntries.map(({ interval, slot }) => (
                        <div key={interval.id} className="rounded-md border bg-background px-3 py-2">
                          <p className="break-words text-sm font-medium leading-snug">{interval.task_description}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            {slot.category?.ata_chapter && (
                              <span className="font-mono">ATA {slot.category.ata_chapter}</span>
                            )}
                            {slot.position && (
                              <>
                                <span className="text-border">·</span>
                                <span className="flex items-center gap-1">
                                  <MapPinned className="size-2.5" />
                                  <span className="font-mono">{slot.position}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDirectiveEntries.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <ShieldCheck className="size-3" />
                        Directivas AD
                      </p>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {selectedDirectiveEntries.length}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {selectedDirectiveEntries.map((directive) => (
                        <div key={directive.id} className="rounded-md border bg-background px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-semibold">{directive.ad_number}</span>
                            <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                              {directive.authority}
                            </Badge>
                          </div>
                          {directive.subject_description && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                              {directive.subject_description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-8 text-center text-muted-foreground">
              <ClipboardList className="size-6 opacity-30" />
              <p className="text-xs">
                Seleccione controles de mantenimiento, hard time o directivas para ver el resumen.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t px-4 py-3">
          <Button className="w-full gap-2" disabled={totalSelected === 0 || isSubmitting} onClick={onSubmit}>
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
