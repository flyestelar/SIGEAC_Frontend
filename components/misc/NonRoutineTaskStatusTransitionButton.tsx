'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { useUpdateNonRoutineTaskStatusMutation } from '@/hooks/planificacion/useNonRoutineTasks';
import { NonRoutineTaskStatus } from '@api/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const nextStatus: Record<NonRoutineTaskStatus, NonRoutineTaskStatus | null> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'CLOSED',
  CLOSED: null,
};

interface NonRoutineTaskStatusTransitionButtonProps extends ButtonProps {
  taskId: number;
  workOrderItemTaskId: number;
  currentStatus: NonRoutineTaskStatus;
  size?: 'default' | 'sm' | 'lg';
}

export function NonRoutineTaskStatusTransitionButton({
  taskId,
  workOrderItemTaskId,
  currentStatus,
  size = 'sm',
  ...props
}: NonRoutineTaskStatusTransitionButtonProps) {
  const mutation = useUpdateNonRoutineTaskStatusMutation(workOrderItemTaskId);
  const next = nextStatus[currentStatus];

  if (!next) {
    return null;
  }

  const labelMap: Record<NonRoutineTaskStatus, string> = {
    OPEN: 'Mark In Progress',
    IN_PROGRESS: 'Mark Closed',
    CLOSED: '',
  };

  const handleClick = async () => {
    try {
      await mutation.mutateAsync({
        path: { id: taskId },
        body: { status: next },
      });
      toast.success(`Status changed to ${next}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    }
  };

  return (
    <Button size={size} onClick={handleClick} disabled={mutation.isPending} {...props}>
      {mutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {labelMap[currentStatus]}
    </Button>
  );
}
