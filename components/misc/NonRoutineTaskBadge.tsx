'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NonRoutineTaskResource } from '@api/types';

interface NonRoutineTaskBadgeProps {
  tasks: NonRoutineTaskResource[] | undefined;
  className?: string;
}

export function NonRoutineTaskBadge({
  tasks = [],
  className,
}: NonRoutineTaskBadgeProps) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const pendingCount = tasks.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  ).length;

  if (pendingCount === 0) {
    return null;
  }

  const isPriority = tasks.some((t) => t.status === 'OPEN');

  return (
    <Badge
      variant={isPriority ? 'default' : 'secondary'}
      className={cn(
        isPriority ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600',
        className
      )}
    >
      {pendingCount} pending
    </Badge>
  );
}
