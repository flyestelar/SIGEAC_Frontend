'use client';

import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AlertTriangle, ClipboardList, FileCheck2, Gauge, Loader2, Plane, ShieldCheck, Wrench } from 'lucide-react';

interface SelectionSummaryProps {
  aircraft: AircraftResource;
  controls: MaintenanceControlResource[];
  selectedControls: Map<number, { taskCardIds: Set<number>; description: string }>;
  totalTaskCards: number;
  pendingDescriptionsCount: number;
  coveragePercentage: number;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const SelectionSummary = ({
  aircraft,
  controls,
  selectedControls,
  totalTaskCards,
  pendingDescriptionsCount,
  coveragePercentage,
  onSubmit,
  isSubmitting,
}: SelectionSummaryProps) => {
  const selectedControlEntries = controls
    .filter((control) => selectedControls.has(control.id))
    .map((control) => ({
      control,
      item: selectedControls.get(control.id)!,
    }));

  const readinessLabel =
    totalTaskCards === 0
      ? 'Sin seleccion'
      : pendingDescriptionsCount > 0
        ? 'Seleccion parcial'
        : 'Listo para emitir';

  const readinessTone =
    totalTaskCards === 0
      ? 'border-border bg-muted/20 text-muted-foreground'
      : pendingDescriptionsCount > 0
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400';

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <div className="rounded-lg border bg-background">
        <div className="border-b bg-muted/20 px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Manifiesto de WO</p>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10">
              <Plane className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold tracking-widest">{aircraft.acronym}</p>
              <p className="truncate text-xs text-muted-foreground">
                {aircraft.manufacturer?.name ?? 'Fabricante no disponible'} · S/N {aircraft.serial ?? '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Controles</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{selectedControlEntries.length}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Task cards</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{totalTaskCards}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Cobertura</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{coveragePercentage}%</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Pendientes</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{pendingDescriptionsCount}</p>
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Gauge className="size-3.5" />
                Cobertura del manifiesto
              </p>
              <span className="font-mono text-xs font-semibold tabular-nums">{coveragePercentage}%</span>
            </div>
            <Progress value={coveragePercentage} className="mt-2 h-2 bg-muted/40" indicatorClassName="bg-sky-500" />
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedControlEntries.length > 0
                ? 'La cobertura mide cuantas task cards del programa estan entrando en esta WO.'
                : 'La cobertura se actualiza cuando empiece la seleccion de task cards.'}
            </p>
          </div>

          <div className={cn('rounded-md border px-3 py-3', readinessTone)}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              <p className="text-sm font-semibold">{readinessLabel}</p>
            </div>
            <p className="mt-1 text-xs">
              {totalTaskCards === 0
                ? 'Seleccione task cards para empezar a preparar el documento.'
                : pendingDescriptionsCount > 0
                  ? 'Complete las descripciones por item antes de emitir la orden.'
                  : 'La seleccion y las descripciones estan completas para continuar.'}
            </p>
          </div>

          {pendingDescriptionsCount > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                <p className="text-sm font-semibold">Revision requerida</p>
              </div>
              <p className="mt-1 text-xs">
                Hay {pendingDescriptionsCount} item{pendingDescriptionsCount !== 1 ? 's' : ''} sin descripcion.
              </p>
            </div>
          )}

          {selectedControlEntries.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Bloques incluidos</p>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {selectedControlEntries.length}
                </Badge>
              </div>

              <ScrollArea className="h-[260px] rounded-md border">
                <div className="space-y-2 p-2">
                  {selectedControlEntries.map(({ control, item }) => {
                    const selectedCount = item.taskCardIds.size;
                    const totalCount = control.task_cards?.length ?? 0;
                    const isComplete = selectedCount > 0 && selectedCount === totalCount;
                    const hasDescription = !!item.description.trim();

                    return (
                      <div key={control.id} className="rounded-md border bg-background px-3 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{control.title}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {control.manual_reference ?? 'Sin referencia'}
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

                        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5',
                              hasDescription
                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {hasDescription ? 'Descripcion lista' : 'Descripcion pendiente'}
                          </span>
                          {(control.since_last?.fh || control.since_last?.fc || control.since_last?.days) && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                              <Wrench className="size-3" />
                              Tiene consumo registrado
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
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center text-muted-foreground">
              <ClipboardList className="size-7 opacity-30" />
              <p className="text-sm">Todavia no hay controles ni task cards dentro del manifiesto.</p>
            </div>
          )}
        </div>

        <div className="space-y-2 border-t px-5 py-3">
          <Button className="w-full gap-2" disabled={totalTaskCards === 0 || isSubmitting} onClick={onSubmit}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
            {isSubmitting ? 'Generando...' : 'Preparar items de la WO'}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            {totalTaskCards === 0
              ? 'Seleccione al menos una task card para continuar.'
              : pendingDescriptionsCount > 0
                ? 'Revise los items y complete descripciones antes de emitir.'
                : 'El manifiesto esta listo para validacion final.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectionSummary;
