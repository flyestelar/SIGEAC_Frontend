'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardTimeAlertLevel, HardTimeIntervalWithMetrics, HardTimeMetric } from '@/types';
import { CircleOff, ListPlus, MapPinned, PackageMinus, PackagePlus, PlusCircle, Timer } from 'lucide-react';
import { AlertBadge, computeIntervalMetrics, LEVEL_CONFIG, METRIC_ICONS, METRIC_LABELS, METRIC_UNITS, STATUS_ORDER } from './hard-time-shared';
import { AircraftComponentSlotResource } from '@api/types';

function estimatedDaysToExpiry(
  metric: HardTimeMetric,
  averageDailyFH?: number | null,
  averageDailyFC?: number | null,
): number | null {
  if (metric.remaining <= 0) return 0;
  if (metric.type === 'DAYS') return metric.remaining;
  if (metric.type === 'FH' && averageDailyFH && averageDailyFH > 0) return metric.remaining / averageDailyFH;
  if (metric.type === 'FC' && averageDailyFC && averageDailyFC > 0) return metric.remaining / averageDailyFC;
  return null;
}

interface HardTimeCardProps {
  component: AircraftComponentSlotResource;
  onSelect: () => void;
  averageDailyFH?: number | null;
  averageDailyFC?: number | null;
  aircraftFlightHours?: number | null;
  aircraftFlightCycles?: number | null;
  onInstall?: () => void;
  onUninstall?: () => void;
  onCreateInterval?: () => void;
}

export function HardTimeCard({
  component,
  onSelect,
  averageDailyFH,
  averageDailyFC,
  aircraftFlightHours,
  aircraftFlightCycles,
  onInstall,
  onUninstall,
  onCreateInterval,
}: HardTimeCardProps) {
  const isVacant = !component.active_installation;
  const rawIntervals = component.installed_part?.intervals ?? [];
  const rawIntervalsCount = rawIntervals.length;
  const installation = component.active_installation;

  const intervals = useMemo<HardTimeIntervalWithMetrics[]>(() => {
    if (!installation || aircraftFlightHours == null || aircraftFlightCycles == null) return [];
    return rawIntervals
      .filter((i) => i.is_active !== false)
      .map((i) => computeIntervalMetrics(i, installation, aircraftFlightHours, aircraftFlightCycles));
  }, [rawIntervals, installation, aircraftFlightHours, aircraftFlightCycles]);

  const componentStatus = useMemo<HardTimeAlertLevel>(() => {
    return intervals.reduce<HardTimeAlertLevel>(
      (worst, i) => (STATUS_ORDER[i.status] > STATUS_ORDER[worst] ? i.status : worst),
      'OK',
    );
  }, [intervals]);

  const cfg = LEVEL_CONFIG[componentStatus];
  const LevelIcon = cfg.icon;

  const statusCounts: Record<HardTimeAlertLevel, number> = { OK: 0, WARNING: 0, OVERDUE: 0 };
  intervals.forEach((i) => {
    statusCounts[i.status]++;
  });

  const allMetricsWithTask = intervals.flatMap((i) => i.metrics);

  const closestMetric = (() => {
    if (allMetricsWithTask.length === 0) return null;

    const withEstimates = allMetricsWithTask
      .map((m) => ({ ...m, estDays: estimatedDaysToExpiry(m, averageDailyFH, averageDailyFC) }))
      .filter((m) => m.estDays !== null);

    if (withEstimates.length === 0) return null;

    const allOverdue = withEstimates.every((m) => m.estDays === 0);
    if (allOverdue) {
      return withEstimates.sort((a, b) => b.percentage - a.percentage)[0];
    }

    return withEstimates.sort((a, b) => a.estDays! - b.estDays!)[0];
  })();

  const category = component.category;
  const hasInstalledPart = Boolean(
    component?.installed_part_id ?? component?.installed_part?.id ?? component?.active_installation,
  );
  const canCreateInterval = Boolean(onCreateInterval && hasInstalledPart);
  if (isVacant) {
    return (
      <Card
        className="group cursor-pointer overflow-hidden rounded-lg border border-dashed border-sky-500/30 bg-sky-500/[0.04] transition-colors hover:border-sky-500/50 hover:bg-sky-500/[0.07]"
        onClick={onSelect}
      >
        <CardHeader className="space-y-2 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10">
                <PackagePlus className="h-3.5 w-3.5 text-sky-700 dark:text-sky-300" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[15px] font-semibold leading-tight text-foreground">
                  {component.batch?.name || 'Sin nombre'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPinned className="h-3 w-3" />
                  <span className="font-mono text-foreground/80">{component.position}</span>
                  {category?.ata_chapter && (
                    <>
                      <span className="text-border">·</span>
                      <span className="font-mono">ATA {category.ata_chapter}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="h-5 shrink-0 gap-1 border-sky-500/20 bg-sky-500/10 px-1.5 text-[10px] text-sky-700 dark:text-sky-300"
            >
              <CircleOff className="h-2.5 w-2.5" />
              Vacío
            </Badge>
          </div>
          <div className="flex items-center gap-3 pl-[38px] text-[11px] text-muted-foreground">
            <span className="font-mono">P/N: {component.part_number}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pb-3 pt-0">
          <div className="flex items-center gap-2 rounded-md border border-dashed border-sky-500/20 bg-background/60 px-3 py-2">
            <PlusCircle className="h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-300" />
            <p className="text-[11px] text-foreground/80">Monta un componente para activar el control hard time.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="h-5 border-border/60 px-2 text-[10px] font-normal">
              {rawIntervalsCount} intervalo{rawIntervalsCount !== 1 && 's'}
            </Badge>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {canCreateInterval ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateInterval?.();
                  }}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  Intervalo
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 border-sky-500/30 px-2.5 text-[11px] text-sky-700 hover:bg-sky-500/10 dark:text-sky-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall?.();
                }}
              >
                <PackagePlus className="h-3.5 w-3.5" />
                Montar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`group cursor-pointer overflow-hidden rounded-lg transition-colors hover:brightness-[0.99] dark:hover:brightness-110 ${cfg.cardBorder} ${cfg.cardBg}`}
      onClick={onSelect}
    >
      <CardHeader className="space-y-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cfg.iconBg}`}>
              <LevelIcon className={`h-3.5 w-3.5 ${cfg.iconText}`} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-[15px] font-semibold leading-tight text-foreground">
                {component.description || 'Sin nombre'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPinned className="h-3 w-3" />
                <span className="font-mono text-foreground/80">{component.position}</span>
                {category?.ata_chapter && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono">ATA {category.ata_chapter}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <AlertBadge status={componentStatus} size="small" />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-[38px] text-[11px] text-muted-foreground">
          <span className="font-mono">P/N: {component.active_installation?.part_number ?? component.part_number}</span>
          {component.active_installation && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono">S/N: {component.active_installation.serial_number}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-3 pt-0">
        {allMetricsWithTask.length > 0 ? (
          <div className="space-y-2 rounded-md border border-border/60 bg-background/70 px-3 py-2.5">
            {allMetricsWithTask.map((metric, idx) => {
              const mCfg = LEVEL_CONFIG[metric.status];
              const Icon = METRIC_ICONS[metric.type];
              return (
                <div key={`${metric.taskDescription}-${metric.type}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3 w-3 shrink-0" />
                      {METRIC_LABELS[metric.type]}
                    </p>
                    {metric.remaining <= 0 ? (
                      <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">VENCIDO</span>
                    ) : (
                      <span className="font-mono text-[10px] font-medium text-muted-foreground">
                        {metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.
                      </span>
                    )}
                  </div>
                  <Progress
                    value={Math.min(metric.percentage, 100)}
                    className="h-1.5"
                    indicatorClassName={mCfg.progressIndicator}
                  />
                </div>
              );
            })}
          </div>
        ) : canCreateInterval ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 bg-background/50 py-2 text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onCreateInterval?.();
            }}
          >
            <ListPlus className="h-3.5 w-3.5" />
            Sin intervalos — añadir uno
          </button>
        ) : null}

        <div className="flex flex-col items-center justify-between gap-2 pt-0.5">
          <div className='flex shrink-0 gap-1 justify-between'>
            <div className="flex min-w-0 items-center gap-2">
              <Badge variant="outline" className="h-5 shrink-0 border-border/60 px-2 text-[10px] font-normal">
                {intervals.length} intervalo{intervals.length !== 1 && 's'}
              </Badge>
              {intervals.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-medium">
                  {statusCounts.OVERDUE > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      {statusCounts.OVERDUE} vencido{statusCounts.OVERDUE !== 1 && 's'}
                    </span>
                  )}
                  {statusCounts.WARNING > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {statusCounts.WARNING} próximo{statusCounts.WARNING !== 1 && 's'}
                    </span>
                  )}
                  {statusCounts.OK > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">{statusCounts.OK} OK</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {canCreateInterval && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateInterval?.();
                  }}
                >
                  <ListPlus className="h-3 w-3" />
                  Intervalo
                </Button>
              )}
            </div>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="h-8 gap-1 border-amber-500/30 px-2 text-[13px] text-amber-600 hover:bg-amber-500/10"
            onClick={(e) => {
              e.stopPropagation();
              onUninstall?.();
            }}
          >
            <PackageMinus className="h-3 w-3" />
            Desmontar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
