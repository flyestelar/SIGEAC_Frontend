'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUpdateNonRoutineTaskStatusMutation } from '@/hooks/planificacion/useNonRoutineTasks';
import { NonRoutineTaskResource, NonRoutineTaskStatus } from '@api/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, FileText, LayoutGrid, Loader2, Play, Table2, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface NonRoutineTasksListProps {
  tasks: NonRoutineTaskResource[];
  orderNumber?: string;
}

const STATUS_META: Record<NonRoutineTaskStatus, { label: string; dot: string; bg: string; border: string }> = {
  OPEN: {
    label: 'Abierta',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-700',
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700',
  },
  CLOSED: {
    label: 'Cerrada',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
  },
};

const TRANSITIONS: Record<
  NonRoutineTaskStatus,
  { to: NonRoutineTaskStatus; label: string; icon: React.ElementType }[]
> = {
  OPEN: [
    { to: 'IN_PROGRESS', label: 'En progreso', icon: Play },
    { to: 'CLOSED', label: 'Cerrar', icon: CheckCircle2 },
  ],
  IN_PROGRESS: [{ to: 'CLOSED', label: 'Cerrar', icon: CheckCircle2 }],
  CLOSED: [],
};

function StatusButton({
  task,
  transition,
  orderNumber,
}: {
  task: NonRoutineTaskResource;
  transition: { to: NonRoutineTaskStatus; label: string; icon: React.ElementType };
  orderNumber?: string;
}) {
  const mutation = useUpdateNonRoutineTaskStatusMutation(task.work_order_item_task_id, orderNumber);
  const Icon = transition.icon;

  const handleClick = async () => {
    try {
      await mutation.mutateAsync({ path: { id: task.id }, body: { status: transition.to } });
      toast.success(`Estado cambiado a ${STATUS_META[transition.to].label}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ocurrió un error');
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={mutation.isPending}
      className="h-7 gap-1 text-[11px] font-medium"
    >
      {mutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Icon className={'size-3'} />}
      {transition.label}
    </Button>
  );
}

function StatusDotBadge({ status }: { status: NonRoutineTaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-[11px] font-medium tabular-nums">
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export const NonRoutineTasksList = ({ tasks, orderNumber }: NonRoutineTasksListProps) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} no rutinaria{tasks.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
          className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {viewMode === 'cards' ? (
            <>
              <Table2 className="size-3" /> Vista tabla
            </>
          ) : (
            <>
              <LayoutGrid className="size-3" /> Vista tarjetas
            </>
          )}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <FileText className="size-8 opacity-20" />
          <p className="text-sm">No hay tareas no rutinarias registradas</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tasks.map((task) => {
            const meta = STATUS_META[task.status];
            return (
              <div
                key={task.id}
                className={cn(
                  'group relative flex flex-col rounded-xl border p-4 transition-all hover:shadow-md',
                  meta.bg,
                  meta.border,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground/60">#{task.id}</span>
                  <StatusDotBadge status={task.status} />
                </div>

                <h4 className="mt-3 text-sm font-semibold leading-snug">{task.finding}</h4>

                <div className="mt-2 flex-1">
                  <p className="text-xs text-muted-foreground/70">Trabajo a realizar</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground/80">{task.work_to_perform}</p>
                </div>

                {task.remarks && (
                  <div className="mt-3 rounded-lg border border-dashed bg-background/50 px-3 py-2">
                    <p className="text-[11px] font-medium text-muted-foreground/60">Observaciones</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{task.remarks}</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="size-3" />
                    {task.detected_by}
                  </span>
                  <ButtonGroup>
                    {TRANSITIONS[task.status].map((t) => (
                      <StatusButton key={t.to} task={task} transition={t} orderNumber={orderNumber} />
                    ))}
                  </ButtonGroup>
                </div>

                {task.closed_at && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Cerrada {format(new Date(task.closed_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Hallazgo
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Trabajo a Realizar
                </TableHead>
                <TableHead className="w-28 whitespace-nowrap text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Estado
                </TableHead>
                <TableHead className="w-28 whitespace-nowrap text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Detectado por
                </TableHead>
                <TableHead className="w-28 whitespace-nowrap text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Cerrada
                </TableHead>
                <TableHead className="w-40 whitespace-nowrap text-right text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const meta = STATUS_META[task.status];
                return (
                  <TableRow key={task.id} className={cn('group', meta.bg)}>
                    <TableCell className="max-w-[240px]">
                      <span className="truncate text-sm font-medium" title={task.finding}>
                        {task.finding}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <span className="truncate text-sm text-muted-foreground" title={task.work_to_perform}>
                        {task.work_to_perform}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusDotBadge status={task.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{task.detected_by}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {task.closed_at ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          {format(new Date(task.closed_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ButtonGroup className="ml-auto">
                        {TRANSITIONS[task.status].map((t) => (
                          <StatusButton key={t.to} task={task} transition={t} orderNumber={orderNumber} />
                        ))}
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
