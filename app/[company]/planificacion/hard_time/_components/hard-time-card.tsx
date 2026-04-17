'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardTimeComponentWithMetrics, HardTimeMetric } from '@/types';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, CircleOff, PackageMinus, PackagePlus } from 'lucide-react';
import { AlertBadge, LEVEL_CONFIG, METRIC_ICONS, METRIC_LABELS, METRIC_UNITS } from './hard-time-shared';

interface MetricCardProps {
  metric: HardTimeMetric;
  taskDescription: string;
  averageDailyFH?: number | null;
  averageDailyFC?: number | null;
}

function MetricCard({ metric, taskDescription, averageDailyFH, averageDailyFC }: MetricCardProps) {
  const cfg = LEVEL_CONFIG[metric.status];
  const Icon = METRIC_ICONS[metric.type];

  // Estimate due date based on remaining and daily averages
  const estimatedDate = (() => {
    if (metric.remaining <= 0) return null;
    if (metric.type === 'FH' && averageDailyFH && averageDailyFH > 0) {
      return addDays(new Date(), Math.ceil(metric.remaining / averageDailyFH));
    }
    if (metric.type === 'FC' && averageDailyFC && averageDailyFC > 0) {
      return addDays(new Date(), Math.ceil(metric.remaining / averageDailyFC));
    }
    if (metric.type === 'DAYS') {
      return addDays(new Date(), Math.ceil(metric.remaining));
    }
    return null;
  })();

  return (
    <div className="rounded-md border border-border/50 bg-muted/15 px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" />
        {METRIC_LABELS[metric.type]}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">{taskDescription}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
        <span className={cfg.iconText}>{metric.consumed.toFixed(1)}</span>
        <span className="text-muted-foreground">/{metric.interval}</span>
        <span className="ml-1 text-[11px] font-normal text-muted-foreground">{METRIC_UNITS[metric.type]}</span>
      </p>
      <p className="font-mono text-[11px] text-muted-foreground">
        ({metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.)
      </p>
      <Progress value={Math.min(metric.percentage, 100)} className="mt-2 h-1.5" indicatorClassName={cfg.progressIndicator} />
      <div className="mt-2 border-t border-border/30 pt-1.5">
        {estimatedDate ? (
          <div className="flex items-center gap-1 text-[10px]">
            <CalendarClock className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="font-mono font-medium">{format(estimatedDate, 'dd MMM yy', { locale: es })}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <CalendarClock className="h-3 w-3" />
            <span>Sin datos</span>
          </div>
        )}
      </div>
    </div>
  );
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
  const cfg = LEVEL_CONFIG[component.status];
  const LevelIcon = cfg.icon;

  const allMetrics = component.intervals.flatMap((interval) =>
    (interval.metrics ?? []).map((metric) => ({ metric, taskDescription: interval.task_description })),
  );

  const isVacant = !component.active_installation;

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
              <p className="truncate text-[11px] text-muted-foreground">{component.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isVacant && (
              <Badge
                variant="outline"
                className="h-5 border-muted-foreground/30 bg-muted/20 px-1.5 text-[10px] text-muted-foreground"
              >
                <CircleOff className="mr-0.5 h-2.5 w-2.5" />
                Vacante
              </Badge>
            )}
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
          {component.ata_chapter && (
            <>
              <span className="text-border">·</span>
              <span>ATA {component.ata_chapter}</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        {allMetrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allMetrics.map(({ metric, taskDescription }, idx) => (
              <MetricCard
                key={idx}
                metric={metric}
                taskDescription={taskDescription}
                averageDailyFH={averageDailyFH}
                averageDailyFC={averageDailyFC}
              />
            ))}
          </div>
        )}

        {allMetrics.length === 0 && (
          <div className="rounded-md border border-dashed border-border/50 py-3 text-center">
            <p className="text-xs text-muted-foreground">Sin intervalos configurados</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="h-5 border-border/50 px-2 text-[10px] font-normal">
            {component.intervals.length} intervalo{component.intervals.length !== 1 && 's'}
          </Badge>
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
