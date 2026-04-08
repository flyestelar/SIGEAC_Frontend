'use client';

import { useState, useMemo } from 'react';
import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface MaintenanceControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controls: MaintenanceControlResource[];
  selectedControlIds: Set<number>;
  aircraft: AircraftResource | null;
  onConfirm: (controlIds: Set<number>) => void;
}

type ConsumptionLevel = 'low' | 'medium' | 'high' | 'critical';

const getConsumptionLevel = (percentage: number): ConsumptionLevel => {
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
};

const CONSUMPTION_STYLES: Record<ConsumptionLevel, { bar: string; text: string; badge: string }> = {
  low: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  medium: {
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  high: {
    bar: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },
  critical: {
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    badge: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

const ConsumptionBar = ({ percentage, label }: { percentage: number; label: string }) => {
  const level = getConsumptionLevel(percentage);
  const styles = CONSUMPTION_STYLES[level];
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] text-muted-foreground w-6 shrink-0 text-right font-mono tabular-nums">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', styles.bar)} style={{ width: `${clamped}%` }} />
      </div>
      <span className={cn('text-[10px] font-mono tabular-nums w-8 shrink-0', styles.text)}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

const getControlConsumption = (control: MaintenanceControlResource) => {
  const sinceLast = control.since_last;
  if (!sinceLast) return null;

  const intervalFh = control.interval_fh;
  const intervalFc = control.interval_fc;
  const intervalDays = control.interval_days;

  const fhPct = intervalFh && intervalFh > 0 ? (sinceLast.fh / intervalFh) * 100 : null;
  const fcPct = intervalFc && intervalFc > 0 ? (sinceLast.fc / intervalFc) * 100 : null;
  const daysPct = intervalDays && intervalDays > 0 ? (sinceLast.days / intervalDays) * 100 : null;

  const remainingFh = intervalFh && intervalFh > 0 ? Math.max(0, intervalFh - sinceLast.fh) : null;
  const remainingFc = intervalFc && intervalFc > 0 ? Math.max(0, intervalFc - sinceLast.fc) : null;
  const remainingDays = intervalDays && intervalDays > 0 ? Math.max(0, intervalDays - sinceLast.days) : null;

  return { fhPct, fcPct, daysPct, remainingFh, remainingFc, remainingDays, intervalFh, intervalFc, intervalDays };
};

const MaintenanceControlDialog = ({
  open,
  onOpenChange,
  controls,
  selectedControlIds,
  aircraft,
  onConfirm,
}: MaintenanceControlDialogProps) => {
  const [localSelected, setLocalSelected] = useState<Set<number>>(new Set(selectedControlIds));
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalSelected(new Set(selectedControlIds));
      setQuery('');
    }
    onOpenChange(isOpen);
  };

  const toggleControl = (controlId: number) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(controlId)) next.delete(controlId);
      else next.add(controlId);
      return next;
    });
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = (query ?? '').toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return controls;
    return controls.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.manual_reference ?? '').toLowerCase().includes(q) ||
        c.task_cards?.some((tc) => (tc.description ?? '').toLowerCase().includes(q)),
    );
  }, [controls, q]);

  const selectedCount = localSelected.size;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl p-0 flex flex-col">
        <DialogHeader className="border-b px-6 py-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4" />
            Seleccionar Controles de Mantenimiento
          </DialogTitle>
          <div className="flex items-center gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por título, referencia o descripción…"
                className="pl-9 h-8 text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="shrink-0 tabular-nums text-xs">
              {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-16 text-muted-foreground">
                <Layers className="size-8 opacity-20" />
                <p className="text-sm">{query ? `Sin resultados para "${query}"` : 'No hay controles disponibles'}</p>
              </div>
            ) : (
              filtered.map((control) => {
                const isSelected = localSelected.has(control.id);
                const isExpanded = expandedIds.has(control.id);
                const consumption = getControlConsumption(control);
                const taskCardsCount = control.task_cards?.length ?? 0;

                const hasCritical =
                  consumption &&
                  ((consumption.fhPct !== null && consumption.fhPct >= 90) ||
                    (consumption.fcPct !== null && consumption.fcPct >= 90) ||
                    (consumption.daysPct !== null && consumption.daysPct >= 90));

                return (
                  <div
                    key={control.id}
                    className={cn(
                      'overflow-hidden rounded-lg border bg-background transition-colors',
                      isSelected && 'border-sky-500/40 bg-sky-500/5',
                    )}
                  >
                    {/* Control row */}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleControl(control.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{control.title}</span>
                          {hasCritical && <ShieldAlert className="size-3.5 text-red-500 shrink-0" />}
                          <Badge variant="outline" className="text-[10px] tabular-nums shrink-0">
                            {taskCardsCount} task card{taskCardsCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{control.manual_reference ?? '—'}</span>
                        </div>

                        {/* Consumption bars */}
                        {consumption && (consumption.fhPct !== null || consumption.fcPct !== null || consumption.daysPct !== null) && (
                          <div className="mt-2 space-y-1 max-w-xs">
                            {consumption.fhPct !== null && <ConsumptionBar percentage={consumption.fhPct} label="FH" />}
                            {consumption.fcPct !== null && <ConsumptionBar percentage={consumption.fcPct} label="FC" />}
                            {consumption.daysPct !== null && <ConsumptionBar percentage={consumption.daysPct} label="D" />}
                          </div>
                        )}

                        {/* Remaining info badges */}
                        {consumption && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {consumption.remainingFh !== null && consumption.fhPct !== null && (
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] gap-1', CONSUMPTION_STYLES[getConsumptionLevel(consumption.fhPct)].badge)}
                              >
                                <Clock className="size-2.5" />
                                Rem: {Math.round(consumption.remainingFh)} FH
                              </Badge>
                            )}
                            {consumption.remainingFc !== null && consumption.fcPct !== null && (
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] gap-1', CONSUMPTION_STYLES[getConsumptionLevel(consumption.fcPct)].badge)}
                              >
                                <RotateCcw className="size-2.5" />
                                Rem: {Math.round(consumption.remainingFc)} FC
                              </Badge>
                            )}
                            {consumption.remainingDays !== null && consumption.daysPct !== null && (
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] gap-1', CONSUMPTION_STYLES[getConsumptionLevel(consumption.daysPct)].badge)}
                              >
                                <CalendarDays className="size-2.5" />
                                Rem: {Math.round(consumption.remainingDays)} días
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expand toggle */}
                      {taskCardsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(control.id)}
                          className="shrink-0 rounded p-1 hover:bg-muted/20 transition-colors"
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

                    {/* Expanded task cards preview */}
                    {isExpanded && (control.task_cards ?? []).length > 0 && (
                      <div className="border-t divide-y">
                        {(control.task_cards ?? []).map((tc) => (
                          <div key={tc.id} className="px-4 py-2 pl-11">
                            <p className="text-xs font-medium leading-tight">{tc.description ?? '—'}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span className="font-mono">{tc.manual_reference ?? '—'}</span>
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4 shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="gap-1.5" onClick={() => onConfirm(localSelected)}>
            <Check className="size-3.5" />
            Confirmar selección ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceControlDialog;
