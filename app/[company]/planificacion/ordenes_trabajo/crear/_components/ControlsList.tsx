'use client';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MaintenanceControlResource, TaskCardResource } from '@api/types';
import {
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  Clock3,
  Loader2,
  RotateCcw,
  Search
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface ControlsListProps {
  controls: MaintenanceControlResource[];
  selectedControls: Map<number, { taskCardIds: Set<number> }>;
  isLoading: boolean;
  onToggleTaskCard: (controlId: number, taskCardId: number) => void;
  onToggleAllTaskCards: (controlId: number, taskCards: TaskCardResource[]) => void;
}

type MetricKind = 'FH' | 'FC' | 'DAYS';

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

const getMetricTone = (percentage: number) => {
  if (percentage >= 90)
    return {
      indicator: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      surface: 'border-red-500/20 bg-red-500/5',
    };
  if (percentage >= 75)
    return {
      indicator: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      surface: 'border-amber-500/20 bg-amber-500/5',
    };
  return {
    indicator: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    surface: 'border-emerald-500/20 bg-emerald-500/5',
  };
};

const buildControlMetrics = (control: MaintenanceControlResource) => {
  if (!control.consumed) return [];
  return (Object.keys(METRIC_META) as MetricKind[]).reduce<
    Array<{ type: MetricKind; consumed: number; interval: number; remaining: number; percentage: number }>
  >((acc, type) => {
    const meta = METRIC_META[type];
    const interval = control[meta.intervalKey];
    const consumed = control.consumed?.[meta.consumedKey];
    if (!interval || interval <= 0 || consumed === undefined || consumed === null) return acc;
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
        taskCards.some((tc) =>
          [tc.description, tc.manual_reference, tc.old_task, tc.new_task]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(search)),
        )
      );
    });
  }, [controls, query]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center gap-3 px-5 py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando controles de mantenimiento…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Controles de Mantenimiento
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredControls.length} control{filteredControls.length !== 1 ? 'es' : ''} disponible
            {filteredControls.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar controles…"
            className="h-8 bg-muted/20 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Controls */}
      {filteredControls.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-16 text-muted-foreground">
          <BookOpenCheck className="size-8 opacity-20" />
          <p className="text-sm">
            {query ? `Sin resultados para "${query}"` : 'No hay controles de mantenimiento asociados a esta aeronave.'}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[720px] rounded-lg border bg-background">
          <div className="space-y-3 p-3">
          {filteredControls.map((control) => {
            const taskCards = control.task_cards ?? [];
            const applicableTaskCards = taskCards.filter((tc) => tc.applicable);
            const metrics = buildControlMetrics(control);
            const maxPct = metrics.reduce((max, m) => Math.max(max, m.percentage), 0);
            const selected = selectedControls.get(control.id);
            const selectedIds = selected?.taskCardIds ?? new Set<number>();
            const selectedCount = selectedIds.size;
            const applicableCount = applicableTaskCards.length;
            const notApplicableCount = taskCards.length - applicableCount;
            const isExpanded = expandedIds.has(control.id);
            const allSelected = applicableCount > 0 && selectedCount === applicableCount;
            const someSelected = selectedCount > 0 && selectedCount < applicableCount;
            const isSelected = selectedCount > 0;

            return (
              <div
                key={control.id}
                className={cn(
                  'overflow-hidden rounded-lg border bg-background transition-colors',
                  isSelected && 'border-sky-500/30',
                )}
              >
                {/* Control header */}
                <div className="flex items-start gap-3 px-4 py-3">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => onToggleAllTaskCards(control.id, taskCards)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{control.title}</span>
                      {selectedCount > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] tabular-nums',
                            allSelected
                              ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {selectedCount}/{taskCards.length}
                        </Badge>
                      )}
                      {notApplicableCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                        >
                          {notApplicableCount} N/A
                        </Badge>
                      )}
                      {metrics.length > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] tabular-nums',
                            maxPct >= 90
                              ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                              : maxPct >= 75
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {Math.round(maxPct)}% consumido
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{control.manual_reference ?? '—'}</span>
                      <span>
                        {taskCards.length} task card{taskCards.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Interval pills + expand */}
                  <div className="flex items-center gap-2 shrink-0">
                    {(control.interval_fh || control.interval_fc || control.interval_days) && (
                      <div className="hidden sm:grid grid-cols-3 gap-1.5 rounded-md border bg-muted/20 px-2 py-1">
                        <div className="text-center">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">FH</p>
                          <p className="font-mono text-[11px] tabular-nums">{control.interval_fh ?? '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">FC</p>
                          <p className="font-mono text-[11px] tabular-nums">{control.interval_fc ?? '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">D</p>
                          <p className="font-mono text-[11px] tabular-nums">{control.interval_days ?? '-'}</p>
                        </div>
                      </div>
                    )}
                    {taskCards.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(control.id)}
                        className="rounded p-1.5 hover:bg-muted/20 transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'size-4 text-muted-foreground transition-transform duration-150',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metrics row */}
                {metrics.length > 0 && (
                  <div className="grid gap-2 border-t px-4 py-3 md:grid-cols-3">
                    {metrics.map((metric) => {
                      const meta = METRIC_META[metric.type];
                      const tone = getMetricTone(metric.percentage);
                      const MetricIcon = meta.icon;
                      return (
                        <div key={metric.type} className={cn('rounded-md border px-3 py-2', tone.surface)}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                              <MetricIcon className="size-3" />
                              {meta.label}
                            </span>
                            <span className={cn('font-mono text-[11px] font-semibold tabular-nums', tone.text)}>
                              {Math.round(metric.percentage)}%
                            </span>
                          </div>
                          <Progress
                            value={metric.percentage}
                            className="mt-1.5 h-1.5 bg-muted/40"
                            indicatorClassName={tone.indicator}
                          />
                          <div className="mt-1.5 flex items-end justify-between text-[11px]">
                            <span className="text-muted-foreground">
                              {metric.consumed.toFixed(metric.type === 'FH' ? 1 : 0)} / {metric.interval}
                            </span>
                            <span className={cn('font-mono tabular-nums', tone.text)}>
                              Rem: {metric.remaining.toFixed(metric.type === 'FH' ? 1 : 0)} {meta.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expanded task cards */}
                {isExpanded && taskCards.length > 0 && (
                  <div className="border-t">
                    <div className="flex items-center justify-between border-b bg-muted/10 px-4 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-widest">Task cards</span>
                      <button
                        type="button"
                        onClick={() => onToggleAllTaskCards(control.id, taskCards)}
                        className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                      >
                        {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                      </button>
                    </div>

                    <ScrollArea className={taskCards.length > 6 ? 'h-[320px]' : ''}>
                      <div className="divide-y">
                        {taskCards.map((tc) => {
                          const isTaskSelected = selectedIds.has(tc.id);
                          const isApplicable = tc.applicable;

                          return (
                            <label
                              key={tc.id}
                              className={cn(
                                'flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors',
                                !isApplicable && 'opacity-50 cursor-not-allowed bg-red-500/5',
                                isTaskSelected && isApplicable && 'bg-sky-500/5',
                                isApplicable && !isTaskSelected && 'hover:bg-muted/10',
                              )}
                            >
                              <Checkbox
                                checked={isTaskSelected}
                                disabled={!isApplicable}
                                onCheckedChange={() => onToggleTaskCard(control.id, tc.id)}
                                className="mt-0.5 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold">
                                    {tc.manual_reference ?? `TC-${tc.id}`}
                                  </span>
                                  {!isApplicable && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                                    >
                                      No aplica
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-foreground/80 line-clamp-2">
                                  {tc.description ?? '—'}
                                </p>
                                {(tc.old_task || tc.new_task) && (
                                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                                    {tc.old_task && (
                                      <span>
                                        <span className="text-muted-foreground/60">Old:</span>{' '}
                                        <span className="font-mono">{tc.old_task}</span>
                                      </span>
                                    )}
                                    {tc.new_task && (
                                      <span>
                                        <span className="text-muted-foreground/60">New:</span>{' '}
                                        <span className="font-mono">{tc.new_task}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ControlsList;
