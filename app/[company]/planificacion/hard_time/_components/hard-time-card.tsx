'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HardTimeAlertLevel, HardTimeComponentWithMetrics, HardTimeMetric } from '@/types';
import { CircleOff, MapPinned, PackageMinus, PackagePlus, Timer } from 'lucide-react';
import { AlertBadge, LEVEL_CONFIG, METRIC_ICONS, METRIC_UNITS } from './hard-time-shared';

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
  component: HardTimeComponentWithMetrics;
  onSelect: () => void;
  averageDailyFH?: number | null;
  averageDailyFC?: number | null;
  onInstall?: () => void;
  onUninstall?: () => void;
}

export function HardTimeCard({
  component,
  onSelect,
  averageDailyFH,
  averageDailyFC,
  onInstall,
  onUninstall,
}: HardTimeCardProps) {
  const cfg = LEVEL_CONFIG[component.status ?? 'OK'];
  const LevelIcon = cfg.icon;
  const isVacant = !component.active_installation;

  // Compute status counters
  const statusCounts: Record<HardTimeAlertLevel, number> = { OK: 0, WARNING: 0, OVERDUE: 0 };
  component.intervals.forEach((i) => {
    const s = i.status ?? 'OK';
    statusCounts[s]++;
  });

  // Find closest deadline by converting all metrics to estimated days
  const allMetricsWithTask = component.intervals.flatMap((i) =>
    (i.metrics ?? []).map((m) => ({ ...m, taskDescription: i.task_description })),
  );

  const closestMetric = (() => {
    if (allMetricsWithTask.length === 0) return null;

    const withEstimates = allMetricsWithTask
      .map((m) => ({ ...m, estDays: estimatedDaysToExpiry(m, averageDailyFH, averageDailyFC) }))
      .filter((m) => m.estDays !== null);

    if (withEstimates.length === 0) return null;

    // If all are overdue (estDays === 0), pick the most overdue (highest percentage)
    const allOverdue = withEstimates.every((m) => m.estDays === 0);
    if (allOverdue) {
      return withEstimates.sort((a, b) => b.percentage - a.percentage)[0];
    }

    return withEstimates.sort((a, b) => a.estDays! - b.estDays!)[0];
  })();

  if (isVacant) {
    return (
      <Card
        className="group cursor-pointer overflow-hidden rounded-xl border border-dashed border-sky-500/30 bg-sky-500/[0.04] transition hover:border-sky-500/40 hover:bg-sky-500/[0.07]"
        onClick={onSelect}
      >
        <CardHeader className="space-y-3 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10">
                <PackagePlus className="h-4 w-4 text-sky-700 dark:text-sky-300" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold leading-snug text-foreground">{component.position}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPinned className="h-3 w-3" />
                    Ubicación disponible
                  </span>
                  <span className="font-mono">P/N: {component.part_number}</span>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="h-5 shrink-0 border-sky-500/20 bg-sky-500/10 px-1.5 text-[10px] text-sky-700 dark:text-sky-300"
            >
              <CircleOff className="mr-1 h-2.5 w-2.5" />
              Slot vacío
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 pb-4 pt-0">
          <div className="rounded-lg border border-dashed border-border/60 bg-background/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Acción sugerida</p>
            <p className="mt-1 text-sm text-foreground">Monta un componente en esta ubicación para activar el control hard time.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-normal">
              {component.intervals.length} intervalo{component.intervals.length !== 1 && 's'}
            </Badge>
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 border-sky-500/30 px-2.5 text-[11px] text-sky-700 hover:bg-sky-500/10 dark:text-sky-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall?.();
                }}
              >
                <PackagePlus className="h-3.5 w-3.5" />
                Montar componente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 ${cfg.cardBorder} ${cfg.cardBg}`}
      onClick={onSelect}
    >
      <CardHeader className="space-y-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${cfg.iconBg}`}>
              <LevelIcon className={`h-3.5 w-3.5 ${cfg.iconText}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-snug text-foreground">{component.position}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPinned className="h-3 w-3" />
                  Ubicación activa
                </span>
                {component.ata_chapter && <span>ATA {component.ata_chapter}</span>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <AlertBadge status={component.status} size="small" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-mono">P/N: {component.active_installation?.part_number ?? component.part_number}</span>
          {component.active_installation && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono">S/N: {component.active_installation.serial_number}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        {closestMetric ? (
          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/15 px-3 py-2">
            <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-[11px]">
              {closestMetric.remaining <= 0 ? (
                <span className="font-semibold text-red-600 dark:text-red-400">VENCIDO</span>
              ) : (
                <>
                  <span className="font-mono font-semibold">
                    {closestMetric.remaining.toFixed(1)} {METRIC_UNITS[closestMetric.type]}
                  </span>
                  <span className="text-muted-foreground"> rest.</span>
                </>
              )}
              <span className="ml-1.5 truncate text-muted-foreground/70">({closestMetric.taskDescription})</span>
            </div>
            {(() => {
              const Icon = METRIC_ICONS[closestMetric.type];
              return <Icon className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/50" />;
            })()}
          </div>
        ) : allMetricsWithTask.length > 0 && !isVacant ? (
          <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/15 px-3 py-2">
            <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Sin datos</span>
              <span className="ml-1.5">sin promedio diario para estimar vencimiento</span>
            </div>
          </div>
        ) : allMetricsWithTask.length === 0 && !isVacant ? (
          <div className="rounded-md border border-dashed border-border/50 py-2.5 text-center">
            <p className="text-[11px] text-muted-foreground">Sin intervalos configurados</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-normal">
              {component.intervals.length} intervalo{component.intervals.length !== 1 && 's'}
            </Badge>
            {component.intervals.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] font-medium">
                {statusCounts.OVERDUE > 0 && (
                  <span className="text-red-600 dark:text-red-400">{statusCounts.OVERDUE} Vencido{statusCounts.OVERDUE !== 1 && 's'}</span>
                )}
                {statusCounts.WARNING > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">{statusCounts.WARNING} Próximo{statusCounts.WARNING !== 1 && 's'}</span>
                )}
                {statusCounts.OK > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">{statusCounts.OK} OK</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {isVacant ? (
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px] text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall?.();
                }}
              >
                <PackagePlus className="h-3 w-3" />
                Montar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px] text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onUninstall?.();
                }}
              >
                <PackageMinus className="h-3 w-3" />
                Desmontar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
