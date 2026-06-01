'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NonRoutineTaskStatus } from '@api/types';

interface NonRoutineTaskStatusBadgeProps {
  status: NonRoutineTaskStatus;
  className?: string;
}

const statusConfig: Record<
  NonRoutineTaskStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  OPEN: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-900',
    label: 'Open',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    label: 'In Progress',
  },
  CLOSED: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    label: 'Closed',
  },
};

export function NonRoutineTaskStatusBadge({
  status,
  className,
}: NonRoutineTaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bg,
        config.border,
        config.text,
        'font-medium',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
