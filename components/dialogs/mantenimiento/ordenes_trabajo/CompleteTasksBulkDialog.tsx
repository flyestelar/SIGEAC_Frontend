'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
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
import { useDebounce } from '@/hooks/helpers/useDebounce';
import { cn } from '@/lib/utils';
import { workOrderBulkCompleteItemTasksMutation, workOrdersShowQueryKey } from '@api/queries';
import { WorkOrderItemResource } from '@api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Loader2, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type CompleteBulkTasksFormValues = {
  review_by: string;
  inspection_date: string;
};

type CompleteTasksBulkDialogProps = {
  open: boolean;
  items: WorkOrderItemResource[];
  orderNumber: string;
  onOpenChange: (open: boolean) => void;
};

export function CompleteTasksBulkDialog({ open, items, orderNumber, onOpenChange }: CompleteTasksBulkDialogProps) {
  const queryClient = useQueryClient();
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [expandedControlValues, setExpandedControlValues] = useState<string[]>([]);
  const debouncedTaskSearch = useDebounce(taskSearchTerm, 300);

  const normalizedSearch = debouncedTaskSearch.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items
      .map((item) => {
        const filteredTasks = (item.tasks ?? []).filter((task) => {
          if (task.review_by) return false;

          const oldTask = String(task.task?.old_task ?? '');
          const newTask = String(task.task?.new_task ?? '');
          const searchBlob = [task.task?.description ?? '', task.task?.manual_reference ?? '', oldTask, newTask]
            .join(' ')
            .toLowerCase();

          if (!normalizedSearch) return true;
          return searchBlob.includes(normalizedSearch);
        });

        return {
          ...item,
          tasks: filteredTasks,
        };
      })
      .filter((item) => (item.tasks?.length ?? 0) > 0);
  }, [items, normalizedSearch]);

  const allPendingTaskIds = useMemo(
    () => items.flatMap((item) => (item.tasks ?? []).filter((task) => !task.review_by).map((task) => task.id)),
    [items],
  );

  const pendingTaskIdsSet = useMemo(() => new Set(allPendingTaskIds), [allPendingTaskIds]);

  useEffect(() => {
    setSelectedTaskIds((prev) => prev.filter((id) => pendingTaskIdsSet.has(id)));
  }, [pendingTaskIdsSet]);

  useEffect(() => {
    if (!normalizedSearch) return;

    setExpandedControlValues(filteredItems.map((item) => `bulk-control-${item.id}`));
  }, [normalizedSearch, filteredItems]);

  const filteredPendingTaskIds = useMemo(
    () => filteredItems.flatMap((item) => (item.tasks ?? []).map((task) => task.id)),
    [filteredItems],
  );

  const selectedTaskSet = useMemo(() => new Set(selectedTaskIds), [selectedTaskIds]);
  const selectedFilteredCount = useMemo(
    () => filteredPendingTaskIds.filter((id) => selectedTaskSet.has(id)).length,
    [filteredPendingTaskIds, selectedTaskSet],
  );

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

  const selectAllFilteredPending = () => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      filteredPendingTaskIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const clearTaskSelection = () => setSelectedTaskIds([]);

  const form = useForm<CompleteBulkTasksFormValues>({
    mode: 'onChange',
    values: {
      review_by: '',
      inspection_date: new Date().toISOString().slice(0, 10),
    },
  });

  const { register, handleSubmit, watch, reset } = form;
  const reviewerName = watch('review_by');
  const reviewDate = watch('inspection_date');

  const completeTaskMutation = useMutation({
    ...workOrderBulkCompleteItemTasksMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workOrdersShowQueryKey({ path: { orderNumber } }) });
    },
    onError: () => {
      toast.error('No se pudo completar el lote de tareas.');
    },
  });

  const onSubmit = (data: CompleteBulkTasksFormValues) => {
    if (selectedTaskIds.length === 0) return;

    completeTaskMutation.mutate(
      {
        path: {
          order_number: orderNumber,
        },
        body: {
          items: selectedTaskIds,
          review_by: data.review_by.trim(),
          inspection_date: data.inspection_date,
        },
      },
      {
        onSuccess: () => {
          toast.success(`${selectedTaskIds.length} tarea(s) completada(s) exitosamente.`);
          setSelectedTaskIds([]);
          setTaskSearchTerm('');
          onOpenChange(false);
          reset({
            review_by: '',
            inspection_date: new Date().toISOString().slice(0, 10),
          });
        },
      },
    );
  };

  const isSubmitting = completeTaskMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setTaskSearchTerm('');
          setSelectedTaskIds([]);
          setExpandedControlValues([]);
          reset({
            review_by: '',
            inspection_date: new Date().toISOString().slice(0, 10),
          });
        }
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Completar tareas seleccionadas</DialogTitle>
          <DialogDescription>
            Busca, selecciona y completa tareas pendientes sin mezclar esta acción con la vista principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              placeholder="Buscar por descripción, manual reference, old task o new task"
              className="h-9 pl-8 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              onClick={selectAllFilteredPending}
              disabled={filteredPendingTaskIds.length === 0}
            >
              Seleccionar todos los resultados
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={clearTaskSelection}
              disabled={selectedTaskIds.length === 0}
            >
              Limpiar selección
            </Button>
            <span className="text-muted-foreground">
              {selectedTaskIds.length} seleccionada{selectedTaskIds.length !== 1 ? 's' : ''} · {selectedFilteredCount}{' '}
              en resultados
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Settings2 className="size-7 opacity-20" />
            <p className="text-sm">
              {normalizedSearch
                ? `No hay resultados para "${debouncedTaskSearch}".`
                : 'No hay tareas pendientes para completar.'}
            </p>
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto rounded-md border">
            <Accordion
              type="multiple"
              className="divide-y"
              value={expandedControlValues}
              onValueChange={setExpandedControlValues}
            >
              {filteredItems.map((item) => (
                <BulkControlAccordionItem
                  key={item.id}
                  item={item}
                  selectedTaskIds={selectedTaskSet}
                  onToggleTaskSelection={toggleTaskSelection}
                  onToggleControlSelection={toggleControlSelection}
                />
              ))}
            </Accordion>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Revisado por</FieldLabel>
            <Input {...register('review_by')} placeholder="Nombre del revisor" />
          </Field>

          <Field>
            <FieldLabel>Fecha de inspección</FieldLabel>
            <Input type="date" {...register('inspection_date')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!reviewerName.trim() || !reviewDate || isSubmitting || selectedTaskIds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Procesando
                </>
              ) : (
                'Completar lote'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkControlAccordionItem({
  item,
  selectedTaskIds,
  onToggleTaskSelection,
  onToggleControlSelection,
}: {
  item: WorkOrderItemResource;
  selectedTaskIds: Set<number>;
  onToggleTaskSelection: (taskId: number, checked: boolean) => void;
  onToggleControlSelection: (taskIds: number[], checked: boolean) => void;
}) {
  const control = item.maintenance_control;
  const tasks = item.tasks ?? [];

  const controlTaskIds = tasks.map((task) => task.id);
  const selectedCount = controlTaskIds.filter((id) => selectedTaskIds.has(id)).length;
  const allSelected = controlTaskIds.length > 0 && selectedCount === controlTaskIds.length;

  return (
    <AccordionItem value={`bulk-control-${item.id}`} className="border-none">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/10 [&[data-state=open]]:bg-muted/10">
        <div className="flex flex-1 items-center gap-3 text-left">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-muted/30">
            <Settings2 className="size-3 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {control?.title ?? `Control #${item.maintenance_control_id}`}
            </p>
            {control?.manual_reference && (
              <p className="font-mono text-[11px] text-muted-foreground">{control.manual_reference}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleControlSelection(controlTaskIds, !allSelected);
            }}
          >
            {allSelected ? 'Quitar control' : 'Seleccionar control'}
          </Button>
          <Badge variant="outline" className="mr-2 shrink-0 gap-1 text-[11px] tabular-nums">
            <Layers className="size-2.5" />
            {tasks.length}
          </Badge>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-1 pt-0">
        <div className="mx-4 mb-3 overflow-hidden rounded-md border">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/10',
                idx !== 0 && 'border-t border-border/50',
              )}
            >
              <Checkbox
                checked={selectedTaskIds.has(task.id)}
                onCheckedChange={(checked) => {
                  onToggleTaskSelection(task.id, !!checked);
                }}
                className="shrink-0"
                aria-label={`Seleccionar task ${task.id}`}
              />

              <span className="w-5 shrink-0 text-center font-mono text-[11px] text-muted-foreground/50">{idx + 1}</span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{task.task?.description ?? `Task #${task.task_id}`}</p>
                {(task.task?.old_task || task.task?.new_task) && (
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {task.task?.old_task && <span>Old Task: {task.task.old_task}</span>}
                    {task.task?.new_task && <span>New Task: {task.task.new_task}</span>}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {task.task?.manual_reference && <span className="font-mono">{task.task.manual_reference}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
