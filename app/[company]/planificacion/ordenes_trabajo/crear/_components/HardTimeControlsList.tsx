'use client';

import { useMemo, useState } from 'react';
import { AircraftComponentSlotResource, HardTimeIntervalResource } from '@api/types';
import { Calendar, Clock3, Gauge, Loader2, MapPinned, RotateCcw, Search, Sigma } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { computeIntervalMetrics, LEVEL_CONFIG, METRIC_UNITS } from '@/app/[company]/planificacion/hard_time/_components/hard-time-shared';

interface HardTimeControlsListProps {
  slots: AircraftComponentSlotResource[];
  aircraftFlightHours: number | null;
  aircraftFlightCycles: number | null;
  selectedIntervalIds: Set<number>;
  onToggleInterval: (intervalId: number) => void;
  onToggleGroup: (intervalIds: number[]) => void;
  isLoading: boolean;
}

type FlatInterval = {
  slot: AircraftComponentSlotResource;
  interval: HardTimeIntervalResource;
};

type GroupedByAta = {
  ataChapter: string;
  ataName: string;
  items: FlatInterval[];
};

const METRIC_ICONS = {
  FH: Clock3,
  FC: RotateCcw,
  DAYS: Calendar,
} as const;

const HardTimeControlsList = ({
  slots,
  aircraftFlightHours,
  aircraftFlightCycles,
  selectedIntervalIds,
  onToggleInterval,
  onToggleGroup,
  isLoading,
}: HardTimeControlsListProps) => {
  const [query, setQuery] = useState('');

  const flatIntervals = useMemo<FlatInterval[]>(() => {
    const result: FlatInterval[] = [];
    for (const slot of slots) {
      const intervals = slot.installed_part?.intervals ?? [];
      for (const interval of intervals) {
        if (interval.is_active === false) continue;
        result.push({ slot, interval });
      }
    }
    return result;
  }, [slots]);

  const filteredIntervals = useMemo<FlatInterval[]>(() => {
    const search = query.trim().toLowerCase();
    if (!search) return flatIntervals;
    return flatIntervals.filter(({ slot, interval }) => {
      const haystack = [
        interval.task_description,
        slot.position,
        slot.category?.ata_chapter,
        slot.category?.name,
        slot.batch?.name,
        slot.description,
      ]
        .filter(Boolean)
        .map((v) => v!.toLowerCase());
      return haystack.some((v) => v.includes(search));
    });
  }, [flatIntervals, query]);

  const groupedByAta = useMemo<GroupedByAta[]>(() => {
    const groups = new Map<string, GroupedByAta>();
    for (const item of filteredIntervals) {
      const chapter = item.slot.category?.ata_chapter ?? 'Sin ATA';
      const name = item.slot.category?.name ?? 'Sin categoría';
      const key = chapter;
      if (!groups.has(key)) {
        groups.set(key, { ataChapter: chapter, ataName: name, items: [] });
      }
      groups.get(key)!.items.push(item);
    }
    return Array.from(groups.values()).sort((a, b) => a.ataChapter.localeCompare(b.ataChapter, undefined, { numeric: true }));
  }, [filteredIntervals]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-background">
        <div className="flex items-center gap-3 px-5 py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando controles hard time…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Controles Hard Time
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filteredIntervals.length} intervalo{filteredIntervals.length !== 1 ? 's' : ''} activo
            {filteredIntervals.length !== 1 ? 's' : ''} · agrupados por ATA
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar intervalos…"
            className="h-8 bg-muted/20 pl-9 text-sm"
          />
        </div>
      </div>

      {groupedByAta.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-16 text-muted-foreground">
          <Sigma className="size-8 opacity-20" />
          <p className="text-sm">
            {query ? `Sin resultados para "${query}"` : 'No hay intervalos hard time activos para esta aeronave.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByAta.map((group) => {
            const groupIds = group.items.map(({ interval }) => interval.id);
            const selectedInGroup = groupIds.filter((id) => selectedIntervalIds.has(id)).length;
            const allSelected = selectedInGroup > 0 && selectedInGroup === groupIds.length;
            const someSelected = selectedInGroup > 0 && selectedInGroup < groupIds.length;

            return (
              <div key={group.ataChapter} className="overflow-hidden rounded-lg border bg-background">
                <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => onToggleGroup(groupIds)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
                        ATA {group.ataChapter}
                      </span>
                      <span className="text-sm font-medium">{group.ataName}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    {selectedInGroup}/{groupIds.length}
                  </Badge>
                </div>

                <div className="divide-y">
                  {group.items.map(({ slot, interval }) => {
                    const isSelected = selectedIntervalIds.has(interval.id);
                    const installation = slot.active_installation;
                    const enriched =
                      installation && aircraftFlightHours != null && aircraftFlightCycles != null
                        ? computeIntervalMetrics(interval, installation, aircraftFlightHours, aircraftFlightCycles)
                        : null;
                    const worstStatus = enriched?.status ?? 'OK';
                    const cfg = LEVEL_CONFIG[worstStatus];

                    return (
                      <label
                        key={interval.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                          isSelected ? 'bg-sky-500/5' : 'hover:bg-muted/20',
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleInterval(interval.id)}
                          className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2">
                            <p className="flex-1 break-words text-sm font-semibold leading-snug">
                              {interval.task_description}
                            </p>
                            {enriched && (
                              <Badge
                                variant="outline"
                                className={cn('shrink-0 text-[10px] tabular-nums', cfg.badgeClass)}
                              >
                                {Math.round(Math.max(0, ...enriched.metrics.map((m) => m.percentage)))}%
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPinned className="size-3" />
                              <span className="font-mono">{slot.position}</span>
                            </span>
                            {slot.batch?.name && (
                              <>
                                <span className="text-border">·</span>
                                <span className="truncate">{slot.batch.name}</span>
                              </>
                            )}
                            {!installation && (
                              <>
                                <span className="text-border">·</span>
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                  Sin instalación activa
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {(['FH', 'FC', 'DAYS'] as const).map((type) => {
                              const intervalValue =
                                type === 'FH'
                                  ? interval.interval_hours
                                  : type === 'FC'
                                    ? interval.interval_cycles
                                    : interval.interval_days;
                              if (intervalValue == null) return null;
                              const Icon = METRIC_ICONS[type];
                              const metric = enriched?.metrics.find((m) => m.type === type);
                              const mCfg = metric ? LEVEL_CONFIG[metric.status] : cfg;
                              return (
                                <div
                                  key={type}
                                  className="flex min-w-[120px] flex-1 items-center gap-2 rounded-md border bg-muted/10 px-2 py-1"
                                >
                                  <Icon className="size-3 shrink-0 text-muted-foreground" />
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono tabular-nums">
                                        {metric
                                          ? `${metric.consumed.toFixed(type === 'FH' ? 1 : 0)} / ${intervalValue}`
                                          : `— / ${intervalValue}`}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">{METRIC_UNITS[type]}</span>
                                    </div>
                                    {metric && (
                                      <Progress
                                        value={Math.min(metric.percentage, 100)}
                                        className="h-1 bg-muted/40"
                                        indicatorClassName={mCfg.progressIndicator}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {interval.interval_hours == null &&
                              interval.interval_cycles == null &&
                              interval.interval_days == null && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Gauge className="size-3" />
                                  Sin intervalo definido
                                </span>
                              )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HardTimeControlsList;
