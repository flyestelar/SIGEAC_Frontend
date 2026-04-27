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
import { workOrderCompleteItemTaskMutation, workOrdersShowQueryKey } from '@api/queries';
import { WorkOrderItemTaskResource } from '@api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type CompleteTaskDialogProps = {
  open: boolean;
  task?: WorkOrderItemTaskResource | null;
  orderNumber: string;
  onOpenChange: (open: boolean) => void;
};

type CompleteTaskFormValues = {
  review_by: string;
  inspection_date: string;
};

function CompleteTaskDialogContent({
  task,
  orderNumber,
  onClose,
}: {
  task?: WorkOrderItemTaskResource | null;
  orderNumber: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<CompleteTaskFormValues>({
    mode: 'onChange',
    values: {
      review_by: task?.review_by ?? '',
      inspection_date: task?.inspection_date ?? new Date().toISOString().slice(0, 10),
    },
  });

  const { register, handleSubmit, watch } = form;
  const reviewerName = watch('review_by');
  const reviewDate = watch('inspection_date');

  const completeTaskMutation = useMutation({
    ...workOrderCompleteItemTaskMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workOrdersShowQueryKey({ path: { orderNumber } }) });
    },
    onError: () => {
      toast.error('No se pudo completar la tarea.');
    },
  });

  const isSubmitting = completeTaskMutation.isPending;

  const onSubmit = (data: CompleteTaskFormValues) => {
    if (!task) return;

    completeTaskMutation.mutate(
      {
        path: {
          order_number: orderNumber,
        },
        body: {
          id: task.id,
          review_by: data.review_by.trim() || '',
          inspection_date: data.inspection_date,
        },
      },
      {
        onSuccess: () => {
          toast.success('Tarea completada exitosamente.');
          onClose();
        },
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Completar tarea</DialogTitle>
        <DialogDescription>{task?.task?.description ?? `Task #${task?.task_id ?? ''}`}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel>Revisor</FieldLabel>
          <Input {...register('review_by')} placeholder="Nombre del revisor" />
        </Field>

        <Field>
          <FieldLabel>Fecha de inspección</FieldLabel>
          <Input type="date" {...register('inspection_date')} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!reviewerName.trim() || !reviewDate || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando
              </>
            ) : (
              'Completar'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function CompleteTaskDialog({ open, task, orderNumber, onOpenChange }: CompleteTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <CompleteTaskDialogContent task={task} orderNumber={orderNumber} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
