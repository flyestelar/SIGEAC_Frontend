'use client';

import {
  AlertBadge,
  EnCursoBadge,
  LEVEL_CONFIG,
  METRIC_ICONS,
  METRIC_UNITS,
} from '@/app/[company]/planificacion/control_mantenimiento/_components/control-grid-shared';
import {
  computeMetricEstimation,
  computeMetrics,
  LEVEL_PRIORITY,
  worstStatus,
} from '@/app/[company]/planificacion/control_mantenimiento/_data/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { maintenanceControlsIndexOptions } from '@api/queries';
import { AircraftAverageMetric } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { formatDate, formatNumber, SectionCard, SectionHeader } from './shared';

type MaintenanceControlsCardProps = {
  aircraftId: number;
  averages: AircraftAverageMetric | null;
};

export function MaintenanceControlsCard({ aircraftId, averages }: MaintenanceControlsCardProps) {
  const { selectedCompany } = useCompanyStore();
  const { data, isLoading } = useQuery({
    ...maintenanceControlsIndexOptions({ query: { aircraft_id: aircraftId } }),
    enabled: !!aircraftId,
  });

  const computed = useMemo(
    () =>
      (data?.data ?? [])
        .filter((c) => c.aircraft_ids?.includes(aircraftId))
        .map((control) => {
          const metrics = computeMetrics(control);
          return { control, metrics, status: worstStatus(metrics) };
        })
        .sort((a, b) => {
          const byStatus = LEVEL_PRIORITY[a.status] - LEVEL_PRIORITY[b.status];
          if (byStatus !== 0) return byStatus;
          const maxPct = (m: typeof a) => Math.max(0, ...m.metrics.map((x) => x.percentage));
          return maxPct(b) - maxPct(a);
        }),
    [data, aircraftId],
  );

  const overdue = computed.filter((c) => c.status === 'OVERDUE').length;
  const warning = computed.filter((c) => c.status === 'WARNING').length;

  return (
    <SectionCard>
      <SectionHeader
        icon={ClipboardCheck}
        title="Controles de mantenimiento"
        description="Consumo de intervalos desde el último cumplimiento"
      >
        {overdue > 0 && (
          <Badge className="h-5 bg-red-500/10 px-1.5 text-[10px] font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400">
            {overdue} vencido{overdue > 1 ? 's' : ''}
          </Badge>
        )}
        {warning > 0 && (
          <Badge className="h-5 bg-amber-500/10 px-1.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
            {warning} por vencer
          </Badge>
        )}
        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
          <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento`}>
            Ver módulo
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </SectionHeader>

      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-1.5 w-2/3" />
            </div>
          ))}
        </div>
      ) : computed.length ? (
        <div className="divide-y">
          {computed.map(({ control, metrics, status }) => (
            <div key={control.id} className="p-5 transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{control.title}</p>
                    {control.in_progress && (
                      <EnCursoBadge workOrderLabel={control.last_execution?.work_order?.order_number} />
                    )}
                  </div>
                  {control.manual_reference && (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{control.manual_reference}</p>
                  )}
                </div>
                <AlertBadge status={status} />
              </div>

              {metrics.length > 0 && (
                <div className="mt-3 space-y-2">
                  {metrics.map((metric) => {
                    const Icon = METRIC_ICONS[metric.type];
                    const cfg = LEVEL_CONFIG[metric.status];
                    const estimation = computeMetricEstimation(metric, averages);
                    return (
                      <div key={metric.type} className="flex items-center gap-3">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-[width] duration-500 ease-out',
                              cfg.progressIndicator,
                            )}
                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="w-32 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {formatNumber(metric.consumed, metric.type === 'FH' ? 1 : 0)} /{' '}
                          {formatNumber(metric.interval)} {METRIC_UNITS[metric.type]}
                        </span>
                        <span
                          className={cn(
                            'hidden w-28 shrink-0 text-right text-xs sm:block',
                            metric.remaining <= 0 ? cfg.accentText : 'text-muted-foreground',
                          )}
                        >
                          {metric.remaining <= 0
                            ? 'Vencido'
                            : estimation
                              ? `vence ${formatDate(estimation.date.toISOString())}`
                              : `quedan ${formatNumber(metric.remaining)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <ClipboardCheck className="h-8 w-8 opacity-20" />
          <p className="text-sm">Sin controles asignados a esta aeronave</p>
          <p className="text-xs">Asígnalos desde el módulo de control de mantenimiento.</p>
        </div>
      )}
    </SectionCard>
  );
}
