'use client';

import { Button } from '@/components/ui/button';
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
  controlTitle: string;
};

type PendingTaskFormValues = {
  review_by: string;
  inspection_date: string;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

export function CompleteWorkOrderDialog({ open, workOrder, orderNumber, onOpenChange }: CompleteWorkOrderDialogProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [taskValues, setTaskValues] = useState<Record<number, PendingTaskFormValues>>({});

  const pendingTasks = useMemo<PendingTaskWithContext[]>(() => {
    const items = workOrder?.items ?? [];
    return items.flatMap((item) => {
      const controlTitle = item.maintenance_control?.title ?? `Control #${item.maintenance_control_id}`;
      return (item.tasks ?? [])
        .filter((task) => !task.review_by)
        .map((task) => ({
          ...task,
          controlTitle,
        }));
    });
  }, [workOrder]);

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
    setConfirmOpen(false);
  }, [open, pendingTasks]);

  const closeWorkOrderMutation = useMutation({
    ...workOrderCloseMutation(),
  });

  const isSubmitting = closeWorkOrderMutation.isPending;

  const updateTaskField = (taskId: number, field: keyof PendingTaskFormValues, value: string) => {
    setTaskValues((prev) => ({
      ...prev,
      [taskId]: {
        review_by: prev[taskId]?.review_by ?? '',
        inspection_date: prev[taskId]?.inspection_date ?? todayDate(),
        [field]: value,
      },
    }));
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Completar orden de trabajo</DialogTitle>
            <DialogDescription>
              {pendingTasks.length > 0
                ? 'Debe completar las task cards pendientes antes de cerrar la orden.'
                : 'No hay task cards pendientes. Puede completar la orden de trabajo.'}
            </DialogDescription>
          </DialogHeader>

          {pendingTasks.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  Tiene {pendingTasks.length} task card{pendingTasks.length !== 1 ? 's' : ''} pendiente
                  {pendingTasks.length !== 1 ? 's' : ''}.
                </p>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {pendingTasks.map((task, idx) => {
                  const values = taskValues[task.id] ?? {
                    review_by: '',
                    inspection_date: todayDate(),
                  };

                  return (
                    <div key={task.id} className="space-y-3 rounded-md border bg-muted/20 p-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {task.controlTitle}
                        </p>
                        <p className="text-sm font-medium">
                          {idx + 1}. {task.task?.description ?? `Task #${task.task_id}`}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field>
                          <FieldLabel>Review by</FieldLabel>
                          <Input
                            value={values.review_by}
                            onChange={(e) => updateTaskField(task.id, 'review_by', e.target.value)}
                            placeholder="Nombre del revisor"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Fecha</FieldLabel>
                          <Input
                            type="date"
                            value={values.inspection_date}
                            onChange={(e) => updateTaskField(task.id, 'inspection_date', e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
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