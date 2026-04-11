'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { workOrderCloseMutation, workOrdersShowQueryKey } from '@api/queries';
import { WorkOrderItemTaskResource, WorkOrderResource } from '@api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type CompleteWorkOrderDialogProps = {
  open: boolean;
  workOrder?: WorkOrderResource;
  orderNumber: string;
  onOpenChange: (open: boolean) => void;
};

type PendingTaskWithContext = WorkOrderItemTaskResource & {
  controlId: number;
  controlTitle: string;
};

type PendingTaskFormValues = {
  review_by: string;
  inspection_date: string;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const hasCompleteValues = (values?: PendingTaskFormValues) =>
  Boolean(values?.review_by?.trim() && values?.inspection_date);

export function CompleteWorkOrderDialog({ open, workOrder, orderNumber, onOpenChange }: CompleteWorkOrderDialogProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [taskValues, setTaskValues] = useState<Record<number, PendingTaskFormValues>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [bulkValues, setBulkValues] = useState<PendingTaskFormValues>({
    review_by: '',
    inspection_date: todayDate(),
  });

  const pendingTasks = useMemo<PendingTaskWithContext[]>(() => {
    const items = workOrder?.items ?? [];
    return items.flatMap((item) => {
      const controlTitle = item.maintenance_control?.title ?? `Control #${item.maintenance_control_id}`;
      return (item.tasks ?? [])
        .filter((task) => !task.review_by)
        .map((task) => ({
          ...task,
          controlId: item.maintenance_control_id,
          controlTitle,
        }));
    });
  }, [workOrder]);

  const groupTasksByControl = (tasks: PendingTaskWithContext[]) => {
    const groups = new Map<number, { controlId: number; controlTitle: string; tasks: PendingTaskWithContext[] }>();

    tasks.forEach((task) => {
      const current = groups.get(task.controlId);
      if (!current) {
        groups.set(task.controlId, {
          controlId: task.controlId,
          controlTitle: task.controlTitle,
          tasks: [task],
        });
        return;
      }

      current.tasks.push(task);
    });

    return Array.from(groups.values());
  };

  const unfilledPendingTasks = useMemo(
    () => pendingTasks.filter((task) => !hasCompleteValues(taskValues[task.id])),
    [pendingTasks, taskValues],
  );

  const filledPendingTasks = useMemo(
    () => pendingTasks.filter((task) => hasCompleteValues(taskValues[task.id])),
    [pendingTasks, taskValues],
  );

  const groupedUnfilledTasks = useMemo(() => groupTasksByControl(unfilledPendingTasks), [unfilledPendingTasks]);
  const groupedFilledTasks = useMemo(() => groupTasksByControl(filledPendingTasks), [filledPendingTasks]);

  useEffect(() => {
    if (!open) return;

    const nextValues: Record<number, PendingTaskFormValues> = {};
    pendingTasks.forEach((task) => {
      nextValues[task.id] = {
        review_by: task.review_by ?? '',
        inspection_date: task.inspection_date ?? todayDate(),
      };
    });

    setTaskValues(nextValues);
    setSelectedTaskIds([]);
    setBulkValues({
      review_by: '',
      inspection_date: todayDate(),
    });
    setConfirmOpen(false);
  }, [open, pendingTasks]);

  useEffect(() => {
    const unfilledIds = new Set(unfilledPendingTasks.map((task) => task.id));
    setSelectedTaskIds((prev) => prev.filter((taskId) => unfilledIds.has(taskId)));
  }, [unfilledPendingTasks]);

  const closeWorkOrderMutation = useMutation({
    ...workOrderCloseMutation(),
  });

  const isSubmitting = closeWorkOrderMutation.isPending;

  const toggleTaskSelection = (taskId: number, checked: boolean) => {
    setSelectedTaskIds((prev) => {
      if (checked) return prev.includes(taskId) ? prev : [...prev, taskId];
      return prev.filter((id) => id !== taskId);
    });
  };

  const toggleControlSelection = (taskIds: number[], checked: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        taskIds.forEach((id) => next.add(id));
      } else {
        taskIds.forEach((id) => next.delete(id));
      }
      return Array.from(next);
    });
  };

  const applyBulkToSelected = () => {
    if (selectedTaskIds.length === 0) {
      toast.error('Seleccione al menos una task card para aplicar el llenado.');
      return;
    }

    if (!bulkValues.review_by.trim() || !bulkValues.inspection_date) {
      toast.error('Indique revisado por y fecha para aplicar en lote.');
      return;
    }

    setTaskValues((prev) => {
      const next = { ...prev };
      selectedTaskIds.forEach((taskId) => {
        next[taskId] = {
          review_by: bulkValues.review_by,
          inspection_date: bulkValues.inspection_date,
        };
      });
      return next;
    });

    setSelectedTaskIds([]);
  };

  const hasInvalidPendingTask = pendingTasks.some((task) => {
    const values = taskValues[task.id];
    return !values?.review_by?.trim() || !values?.inspection_date;
  });

  const handleRequestComplete = () => {
    if (pendingTasks.length > 0 && hasInvalidPendingTask) {
      toast.error('Complete reviewer y fecha en todas las task cards pendientes.');
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmComplete = async () => {
    try {
      await closeWorkOrderMutation.mutateAsync({
        path: {
          order_number: orderNumber,
        },
      });

      await queryClient.invalidateQueries({ queryKey: workOrdersShowQueryKey({ path: { orderNumber } }) });

      toast.success('Orden de trabajo completada correctamente.');
      setConfirmOpen(false);
      onOpenChange(false);
    } catch {
      toast.error('No se pudo completar la orden de trabajo.');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[95vh] flex-col no-scrollbar">
          <DialogHeader>
            <DialogTitle>Completar orden de trabajo</DialogTitle>
            <DialogDescription>
              {pendingTasks.length > 0
                ? 'Debe completar las task cards pendientes antes de cerrar la orden.'
                : 'No hay task cards pendientes. Puede completar la orden de trabajo.'}
            </DialogDescription>
          </DialogHeader>

          {pendingTasks.length > 0 && (
            <div className="space-y-4 overflow-auto min-h-0 flex flex-col">
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  Tiene {pendingTasks.length} task card{pendingTasks.length !== 1 ? 's' : ''} pendiente
                  {pendingTasks.length !== 1 ? 's' : ''}.
                </p>
              </div>

              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Llenado masivo
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Revisado por</FieldLabel>
                    <Input
                      value={bulkValues.review_by}
                      onChange={(e) => setBulkValues((prev) => ({ ...prev, review_by: e.target.value }))}
                      placeholder="Nombre del revisor"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Fecha</FieldLabel>
                    <Input
                      type="date"
                      value={bulkValues.inspection_date}
                      onChange={(e) => setBulkValues((prev) => ({ ...prev, inspection_date: e.target.value }))}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTaskIds(unfilledPendingTasks.map((task) => task.id))}
                    disabled={unfilledPendingTasks.length === 0}
                  >
                    Seleccionar todas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTaskIds([])}
                    disabled={selectedTaskIds.length === 0}
                  >
                    Limpiar selección
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={applyBulkToSelected}>
                    Aplicar a seleccionadas ({selectedTaskIds.length})
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      No rellenadas ({unfilledPendingTasks.length})
                    </p>
                  </div>

                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {groupedUnfilledTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No hay task cards pendientes sin rellenar.</p>
                    ) : (
                      groupedUnfilledTasks.map((group) => {
                        const controlTaskIds = group.tasks.map((task) => task.id);
                        const allControlSelected =
                          controlTaskIds.length > 0 && controlTaskIds.every((taskId) => selectedTaskIds.includes(taskId));

                        return (
                          <div key={`left-${group.controlId}`} className="space-y-3 rounded-md border bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {group.controlTitle}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => toggleControlSelection(controlTaskIds, !allControlSelected)}
                              >
                                {allControlSelected ? 'Quitar control' : 'Seleccionar control'}
                              </Button>
                            </div>

                            {group.tasks.map((task, idx) => (
                              <div key={task.id} className="rounded-md border bg-background p-3">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedTaskIds.includes(task.id)}
                                    onCheckedChange={(checked) => toggleTaskSelection(task.id, !!checked)}
                                    aria-label={`Seleccionar task ${task.id}`}
                                  />
                                  <span className="text-sm font-medium">
                                    {idx + 1}. {task.task?.description ?? `Task #${task.task_id}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <section className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Rellenadas ({filledPendingTasks.length})
                    </p>
                  </div>

                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                    {groupedFilledTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aun no hay task cards rellenadas.</p>
                    ) : (
                      groupedFilledTasks.map((group) => (
                        <div key={`right-${group.controlId}`} className="space-y-3 rounded-md border bg-muted/20 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {group.controlTitle}
                          </p>

                          {group.tasks.map((task, idx) => {
                            const values = taskValues[task.id];
                            return (
                              <div key={task.id} className="space-y-1 rounded-md border bg-background p-3">
                                <p className="text-sm font-medium">
                                  {idx + 1}. {task.task?.description ?? `Task #${task.task_id}`}
                                </p>
                                <p className="text-xs text-muted-foreground">Revisado por: {values?.review_by ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">Fecha: {values?.inspection_date ?? '—'}</p>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleRequestComplete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Procesando
                </>
              ) : (
                'Completar orden'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cierre de orden</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción completará la orden de trabajo y no se podrá deshacer fácilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Confirmando
                </span>
              ) : (
                'Sí, completar orden'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}