'use client';

import { useMemo, useState } from 'react';
import { MaintenanceControlResource, TaskCardResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  Clock3,
  Gauge,
  Layers3,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface ControlsListProps {
  controls: MaintenanceControlResource[];
  selectedControls: Map<number, { taskCardIds: Set<number>; description: string }>;
  isLoading: boolean;
  onToggleTaskCard: (controlId: number, taskCardId: number) => void;
  onToggleAllTaskCards: (controlId: number, taskCards: TaskCardResource[], defaultDescription: string) => void;
}

type MetricKind = 'FH' | 'FC' | 'DAYS';

const getCoverageVariant = (selectedCount: number, totalCount: number) => {
  if (selectedCount === 0) return 'empty';
  if (selectedCount === totalCount) return 'full';
  return 'partial';
};

const coverageStyles = {
  empty: 'border-border bg-muted/20 text-muted-foreground',
  partial: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  full: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
} as const;

const METRIC_META: Record<
  MetricKind,
  {
    label: string;
    icon: typeof Clock3;
    intervalKey: 'interval_fh' | 'interval_fc' | 'interval_days';
    consumedKey: 'fh' | 'fc' | 'days';
    unit: string;
  }
> = {
  FH: { label: 'Horas', icon: Clock3, intervalKey: 'interval_fh', consumedKey: 'fh', unit: 'FH' },
  FC: { label: 'Ciclos', icon: RotateCcw, intervalKey: 'interval_fc', consumedKey: 'fc', unit: 'FC' },
  DAYS: { label: 'Calendario', icon: CalendarDays, intervalKey: 'interval_days', consumedKey: 'days', unit: 'd' },
};

const intervalCell = (value?: number | null, suffix?: string) => {
  if (!value || value <= 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className="font-mono text-xs tabular-nums text-foreground">
      {value} {suffix}
    </span>
  );
};

const getMetricTone = (percentage: number) => {
  if (percentage >= 90) {
    return {
      indicator: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      surface: 'border-red-500/20 bg-red-500/5',
    };
  }

  if (percentage >= 75) {
    return {
      indicator: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      surface: 'border-amber-500/20 bg-amber-500/5',
    };
  }

  return {
    indicator: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    surface: 'border-emerald-500/20 bg-emerald-500/5',
  };
};

const buildControlMetrics = (control: MaintenanceControlResource) => {
  if (!control.since_last) return [];

  return (Object.keys(METRIC_META) as MetricKind[]).reduce<
    Array<{ type: MetricKind; consumed: number; interval: number; remaining: number; percentage: number }>
  >((acc, type) => {
    const meta = METRIC_META[type];
    const interval = control[meta.intervalKey];
    const consumed = control.since_last?.[meta.consumedKey];

    if (!interval || interval <= 0 || consumed === undefined || consumed === null) {
      return acc;
    }

    acc.push({
      type,
      consumed,
      interval,
      remaining: Math.max(0, interval - consumed),
      percentage: Math.max(0, Math.min(100, (consumed / interval) * 100)),
    });

    return acc;
  }, []);
};

const ControlsList = ({
  controls,
  selectedControls,
  isLoading,
  onToggleTaskCard,
  onToggleAllTaskCards,
}: ControlsListProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');

  const filteredControls = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return controls;

    return controls.filter((control) => {
      const taskCards = control.task_cards ?? [];

      return (
        control.title.toLowerCase().includes(search) ||
        (control.manual_reference ?? '').toLowerCase().includes(search) ||
        taskCards.some((taskCard) =>
          [taskCard.description, taskCard.manual_reference, taskCard.old_task, taskCard.new_task]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(search)),
        )
      );
    });
  }, [controls, query]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-3">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Cargando controles de mantenimiento</p>
            <p className="text-xs text-muted-foreground">Preparando mesa operativa para la aeronave seleccionada.</p>
          </div>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border bg-muted/10 p-4">
                <div className="h-4 w-48 rounded bg-muted/40" />
                <div className="mt-3 h-20 rounded bg-muted/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
            <Layers3 className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Mesa operativa</p>
            <h2 className="text-base font-semibold tracking-tight">Controles y task cards</h2>
            <p className="text-sm text-muted-foreground">
              Revise cada control como un bloque de programa, con consumo, remanente y seleccion segura por task card.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Badge variant="outline" className="w-fit text-[10px] tabular-nums">
            {filteredControls.length} control{filteredControls.length !== 1 ? 'es' : ''}
          </Badge>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar titulo, referencia o tarea..."
              className="h-9 bg-muted/20 pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {filteredControls.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
            <BookOpenCheck className="size-8 opacity-30" />
            <p className="text-sm">
              {query ? `Sin resultados para "${query}"` : 'No hay controles de mantenimiento asociados a esta aeronave.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredControls.map((control) => {
              const taskCards = control.task_cards ?? [];
              const applicableTaskCards = taskCards.filter((taskCard) => taskCard.applicable);
              const metrics = buildControlMetrics(control);
              const maxMetricPercentage = metrics.reduce((max, metric) => Math.max(max, metric.percentage), 0);
              const selected = selectedControls.get(control.id);
              const selectedIds = selected?.taskCardIds ?? new Set<number>();
              const selectedCount = selectedIds.size;
              const totalCount = taskCards.length;
              const applicableCount = applicableTaskCards.length;
              const notApplicableCount = totalCount - applicableCount;
              const coverage = getCoverageVariant(selectedCount, totalCount);
              const isExpanded = expandedIds.has(control.id);
              const allSelected = applicableCount > 0 && selectedCount === applicableCount;
              const someSelected = selectedCount > 0 && selectedCount < applicableCount;

              return (
                <div key={control.id} className="overflow-hidden rounded-lg border bg-background">
                  <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                          onCheckedChange={() => onToggleAllTaskCards(control.id, taskCards, control.title)}
                          aria-label={`Seleccionar task cards del control ${control.title}`}
                          className="mt-1 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{control.title}</p>
                            <Badge variant="outline" className={cn('text-[10px] tabular-nums', coverageStyles[coverage])}>
                              {selectedCount}/{totalCount}
                            </Badge>
                            {notApplicableCount > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                              >
                                {notApplicableCount} no aplicable{notApplicableCount !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {(control.interval_fh || control.interval_fc || control.interval_days) && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Programa activo
                              </Badge>
                            )}
                            {metrics.length > 0 && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] tabular-nums',
                                  maxMetricPercentage >= 90
                                    ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                    : maxMetricPercentage >= 75
                                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                                )}
                              >
                                {Math.round(maxMetricPercentage)}% consumido
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-mono">{control.manual_reference ?? 'Sin referencia'}</span>
                            <span>{totalCount} task card{totalCount !== 1 ? 's' : ''}</span>
                            <span>{applicableCount} aplicable{applicableCount !== 1 ? 's' : ''}</span>
                            {metrics.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Gauge className="size-3" />
                                Seguimiento activo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <div className="grid grid-cols-3 gap-2 rounded-md border bg-background px-2 py-1.5">
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">FH</p>
                            <p className="font-mono text-xs tabular-nums">{control.interval_fh ?? '-'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">FC</p>
                            <p className="font-mono text-xs tabular-nums">{control.interval_fc ?? '-'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dias</p>
                            <p className="font-mono text-xs tabular-nums">{control.interval_days ?? '-'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpanded(control.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm transition-colors hover:bg-muted/40"
                        >
                          Ver tareas
                          <ChevronDown className={cn('size-4 transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                      </div>
                    </div>

                    {metrics.length > 0 && (
                      <div className="grid gap-2 md:grid-cols-3">
                        {metrics.map((metric) => {
                          const meta = METRIC_META[metric.type];
                          const tone = getMetricTone(metric.percentage);
                          const MetricIcon = meta.icon;

                          return (
                            <div key={metric.type} className={cn('rounded-md border px-3 py-2.5', tone.surface)}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  <MetricIcon className="size-3" />
                                  {meta.label}
                                </div>
                                <span className={cn('font-mono text-[11px] font-semibold tabular-nums', tone.text)}>
                                  {Math.round(metric.percentage)}%
                                </span>
                              </div>

                              <div className="mt-2">
                                <Progress
                                  value={metric.percentage}
                                  className="h-1.5 bg-muted/40"
                                  indicatorClassName={tone.indicator}
                                />
                              </div>

                              <div className="mt-2 flex items-end justify-between gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">Consumido</p>
                                  <p className="font-mono tabular-nums text-foreground">
                                    {metric.consumed.toFixed(metric.type === 'FH' ? 1 : 0)} / {metric.interval}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground">Remanente</p>
                                  <p className={cn('font-mono tabular-nums', tone.text)}>
                                    {metric.remaining.toFixed(metric.type === 'FH' ? 1 : 0)} {meta.unit}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-0">
                      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="font-semibold uppercase tracking-widest">Tabla de tareas</span>
                          <span>{allSelected ? 'Cobertura completa' : someSelected ? 'Cobertura parcial' : 'Sin seleccion'}</span>
                          {metrics.length > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Gauge className="size-3" />
                              {metrics.length} metrica{metrics.length !== 1 ? 's' : ''} activa{metrics.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {notApplicableCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                              <AlertTriangle className="size-3" />
                              {notApplicableCount} no aplica
                            </span>
                          )}
                        </div>

                        {totalCount > 0 && (
                          <button
                            type="button"
                            onClick={() => onToggleAllTaskCards(control.id, taskCards, control.title)}
                            className="font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                          >
                            {allSelected ? 'Deseleccionar bloque' : 'Seleccionar bloque'}
                          </button>
                        )}
                      </div>

                      <ScrollArea className="h-[440px] w-full">
                        <div className="min-w-[980px]">
                          <Table>
                            <TableHeader className="bg-background">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="sticky top-0 z-10 w-[56px] bg-background">Sel.</TableHead>
                                <TableHead className="sticky top-0 z-10 min-w-[210px] bg-background">Tarea</TableHead>
                                <TableHead className="sticky top-0 z-10 min-w-[280px] bg-background">Descripcion</TableHead>
                                <TableHead className="sticky top-0 z-10 min-w-[120px] bg-background">Old / New</TableHead>
                                <TableHead className="sticky top-0 z-10 w-[96px] bg-background">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock3 className="size-3.5" />
                                    FH
                                  </span>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 w-[96px] bg-background">
                                  <span className="inline-flex items-center gap-1">
                                    <RotateCcw className="size-3.5" />
                                    FC
                                  </span>
                                </TableHead>
                                <TableHead className="sticky top-0 z-10 w-[96px] bg-background">
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="size-3.5" />
                                    Dias
                                  </span>
                                </TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {taskCards.map((taskCard) => {
                                const isSelected = selectedIds.has(taskCard.id);
                                const isApplicable = taskCard.applicable;

                                return (
                                  <TableRow
                                    key={taskCard.id}
                                    data-state={isSelected ? 'selected' : undefined}
                                    className={cn(
                                      isSelected && 'bg-sky-500/5',
                                      !isApplicable && 'bg-red-500/5 hover:bg-red-500/10',
                                    )}
                                  >
                                    <TableCell>
                                      <Checkbox
                                        checked={isSelected}
                                        disabled={!isApplicable}
                                        onCheckedChange={() => onToggleTaskCard(control.id, taskCard.id)}
                                        aria-label={`Seleccionar task card ${taskCard.id}`}
                                      />
                                    </TableCell>

                                    <TableCell className="align-top">
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-mono text-xs font-semibold text-foreground">
                                            {taskCard.manual_reference ?? `TC-${taskCard.id}`}
                                          </p>
                                          {!isApplicable && (
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                                            >
                                              No aplica
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">ID #{taskCard.id}</p>
                                      </div>
                                    </TableCell>

                                    <TableCell className="align-top">
                                      <p className="text-sm leading-relaxed text-foreground">
                                        {taskCard.description ?? 'Sin descripcion registrada'}
                                      </p>
                                      {!isApplicable && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                          Esta task card no aplica a la aeronave seleccionada y queda fuera de la WO.
                                        </p>
                                      )}
                                    </TableCell>

                                    <TableCell className="align-top">
                                      <div className="space-y-1 text-xs">
                                        <p>
                                          <span className="text-muted-foreground">Old:</span>{' '}
                                          <span className="font-mono">{taskCard.old_task ?? '-'}</span>
                                        </p>
                                        <p>
                                          <span className="text-muted-foreground">New:</span>{' '}
                                          <span className="font-mono">{taskCard.new_task ?? '-'}</span>
                                        </p>
                                      </div>
                                    </TableCell>

                                    <TableCell>{intervalCell(control.interval_fh, 'FH')}</TableCell>
                                    <TableCell>{intervalCell(control.interval_fc, 'FC')}</TableCell>
                                    <TableCell>{intervalCell(control.interval_days, 'd')}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlsList;
