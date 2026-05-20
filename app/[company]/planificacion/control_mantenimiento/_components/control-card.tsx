'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftAverageMetric } from '@api/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, ClipboardList, Edit } from 'lucide-react';
import Link from 'next/link';
import {
    AlertBadge,
    ComputedControl,
    EnCursoBadge,
    LEVEL_CONFIG,
    METRIC_ICONS,
    METRIC_LABELS,
    METRIC_UNITS,
    computeMetricEstimation,
} from './control-grid-shared';

interface ControlCardProps {
  computed: ComputedControl;
  onSelect: () => void;
  averages: AircraftAverageMetric | null;
}

export function ControlCard({ computed, onSelect, averages }: ControlCardProps) {
  const { selectedCompany } = useCompanyStore();
  const { control, metrics, status } = computed;

  return (
    <Card className="rounded-xl shadow-md flex flex-col group cursor-pointer overflow-hidden transition-all hover:shadow-lg" onClick={onSelect}>
      <CardHeader className="space-y-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col items-start gap-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-foreground">{control.title}</p>
              {control.manual_reference ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">{control.manual_reference}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {control.in_progress && <EnCursoBadge workOrderLabel={control.last_execution?.work_order?.order_number} />}
            <AlertBadge status={status} size="small" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-0 grow">
        <div className="flex flex-col gap-2">
          {metrics.map((metric) => (
            <ControlMetric key={metric.type} metric={metric} averages={averages} />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-between px-5 py-4">
        <Badge variant="outline" className="h-6 border-border/50 px-2 text-[11px] font-normal">
          <ClipboardList className="mr-1 h-3 w-3" />
          {control.task_cards?.length ?? 0} tasks
        </Badge>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
            <Edit className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ControlMetric({
  metric,
  averages,
}: {
  metric: ComputedControl['metrics'][number];
  averages: AircraftAverageMetric | null;
}) {
  const metricCfg = LEVEL_CONFIG[metric.status];
  const MetricIcon = METRIC_ICONS[metric.type];
  const estimation = averages ? computeMetricEstimation(metric, averages) : null;

  const remaining = Math.max(0, metric.remaining).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    useGrouping: false,
  });
  const consumed = metric.consumed.toLocaleString(undefined, { maximumFractionDigits: 2, useGrouping: false });
  const interval = metric.interval.toLocaleString(undefined, { maximumFractionDigits: 2, useGrouping: false });

  return (
    <div key={metric.type} className="border-b border-border/50 bg-muted/15 pb-2 text-[11px]">
      <div className="flex items-center justify-between">
        <div>
          <span className="mr-1 font-medium uppercase tracking-wide text-muted-foreground">
            <MetricIcon className="inline h-3 w-3" /> {METRIC_LABELS[metric.type]}:
          </span>{' '}
          <span className="font-mono font-semibold tabular-nums">
            <span className={metricCfg.iconText}>{consumed}</span>
            <span className="text-muted-foreground">/{interval}</span>
            <span className="ml-1 font-normal text-muted-foreground">{METRIC_UNITS[metric.type]}</span>
          </span>
        </div>
        <div>
          <span className="font-mono text-muted-foreground">
            ({remaining} {METRIC_UNITS[metric.type]} rest.){' '}
          </span>
          {estimation ? (
            <span>
              <CalendarClock className="mr-1 inline h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="font-mono font-medium">{format(estimation.date, 'dd MMM yy', { locale: es })}</span>
            </span>
          ) : (
            <span className="text-muted-foreground/60">
              <CalendarClock className="mr-1 inline h-3 w-3" />
              <span>Sin datos...</span>
            </span>
          )}
        </div>
      </div>
      <Progress value={metric.percentage} className="h-1.5" indicatorClassName={metricCfg.progressIndicator} />
    </div>
  );
}
