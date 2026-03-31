'use client';

import { useState } from 'react';
import { MaintenanceControl, TaskCard } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronDown, Clock, Layers, RotateCcw, CalendarDays, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlsListProps {
  controls: MaintenanceControl[];
  selectedControls: Map<number, { taskCardIds: Set<number>; description: string }>;
  onToggleTaskCard: (controlId: number, taskCardId: number) => void;
  onToggleAllTaskCards: (controlId: number, taskCards: TaskCard[], defaultDescription: string) => void;
}

const ControlsList = ({ controls, selectedControls, onToggleTaskCard, onToggleAllTaskCards }: ControlsListProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');

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

  const q = query.toLowerCase();
  const filtered = q
    ? controls.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.manual_reference.toLowerCase().includes(q) ||
          c.task_cards.some(
            (tc) =>
              tc.old_task.toLowerCase().includes(q) ||
              tc.new_task.toLowerCase().includes(q) ||
              tc.description.toLowerCase().includes(q),
          ),
      )
    : controls;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded border bg-muted/30 shrink-0">
            <Layers className="size-3.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Controles de Mantenimiento</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} control{filtered.length !== 1 ? 'es' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filtrar controles…"
            className="pl-9 h-8 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Controls list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border py-16 text-muted-foreground">
          <BookOpen className="size-8 opacity-20" />
          <p className="text-sm">
            {query
              ? `Sin resultados para "${query}"`
              : 'No hay controles de mantenimiento asociados a esta aeronave.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((control) => {
            const isExpanded = expandedIds.has(control.id);
            const selectedControl = selectedControls.get(control.id);
            const selectedTcIds = selectedControl?.taskCardIds;
            const selectedCount = selectedTcIds?.size ?? 0;
            const totalTasks = control.task_cards.length;
            const allSelected = totalTasks > 0 && selectedCount === totalTasks;
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <div key={control.id} className="overflow-hidden rounded-lg border bg-background">
                {/* Control header */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(control.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/10"
                >
                  <ChevronDown
                    className={cn(
                      'size-4 text-muted-foreground shrink-0 transition-transform duration-150',
                      isExpanded && 'rotate-180',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold truncate">{control.title}</span>
                      {selectedCount > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] tabular-nums shrink-0',
                            allSelected
                              ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {selectedCount}/{totalTasks}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{control.manual_reference}</span>
                      <span className="text-border">·</span>
                      <span>{totalTasks} task card{totalTasks !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded: task cards */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Select all bar */}
                    {totalTasks > 1 && (
                      <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-2">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                          onCheckedChange={() => onToggleAllTaskCards(control.id, control.task_cards, control.title)}
                          className="shrink-0"
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        </span>
                      </div>
                    )}

                    {/* Task cards */}
                    <div className="divide-y">
                      {control.task_cards.map((tc) => {
                        const isSelected = selectedTcIds?.has(tc.id) ?? false;

                        return (
                          <label
                            key={tc.id}
                            className={cn(
                              'flex items-start gap-4 px-5 py-3 cursor-pointer transition-colors',
                              isSelected ? 'bg-sky-500/5' : 'hover:bg-muted/10',
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onToggleTaskCard(control.id, tc.id)}
                              className="mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-tight">{tc.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                      Ref
                                    </span>
                                    <span className="font-mono text-xs text-foreground/80">{tc.manual_reference}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Task card details row */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
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

                              {/* Intervals */}
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                {tc.interval_fh > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="size-3 shrink-0" />
                                    <span className="font-mono tabular-nums text-foreground/80">{tc.interval_fh}</span>
                                    <span>FH</span>
                                  </div>
                                )}
                                {tc.interval_fc > 0 && (
                                  <div className="flex items-center gap-1">
                                    <RotateCcw className="size-3 shrink-0" />
                                    <span className="font-mono tabular-nums text-foreground/80">{tc.interval_fc}</span>
                                    <span>FC</span>
                                  </div>
                                )}
                                {tc.interval_days > 0 && (
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="size-3 shrink-0" />
                                    <span className="font-mono tabular-nums text-foreground/80">
                                      {tc.interval_days}
                                    </span>
                                    <span>días</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ControlsList;
