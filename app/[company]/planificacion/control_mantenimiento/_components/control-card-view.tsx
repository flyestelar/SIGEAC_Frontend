'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

function ControlCard({
  computed,
  onSelect,
  averages,
}: {
  computed: ComputedControl;
  onSelect: () => void;
  averages: AircraftAverageMetric | null;
}) {
  const { selectedCompany } = useCompanyStore();
  const { control, metrics, status } = computed;
  const cfg = LEVEL_CONFIG[status];
  const LevelIcon = cfg.icon;

  return (
    <Card
      className={`group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 ${cfg.cardBorder} ${cfg.cardBg}`}
      onClick={onSelect}
    >
      <CardHeader className="space-y-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cfg.iconBg}`}>
              <LevelIcon className={`h-4 w-4 ${cfg.iconText}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-foreground">{control.title}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{control.manual_reference}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {control.in_progress && <EnCursoBadge />}
            <AlertBadge status={status} size="medium" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5 pt-0">
        {metrics.length > 0 && (
          <div className="grid auto-cols-fr grid-flow-col gap-2.5">
            {metrics.map((metric) => {
              const metricCfg = LEVEL_CONFIG[metric.status];
              const MetricIcon = METRIC_ICONS[metric.type];
              const estimation = averages ? computeMetricEstimation(metric, averages) : null;
              return (
                <div key={metric.type} className="rounded-md border border-border/50 bg-muted/15 px-3 py-2">
                  <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <MetricIcon className="h-3.5 w-3.5" />
                    {METRIC_LABELS[metric.type]}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums">
                    <span className={metricCfg.iconText}>{metric.consumed.toFixed(1)}</span>
                    <span className="text-muted-foreground">/{metric.interval}</span>
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      {METRIC_UNITS[metric.type]}
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    ({metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.)
                  </p>
                  <Progress
                    value={metric.percentage}
                    className="mt-2 h-1.5"
                    indicatorClassName={metricCfg.progressIndicator}
                  />
                  <div className="mt-2.5 border-t border-border/30 pt-2">
                    {estimation ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {format(estimation.date, 'dd MMM yy', { locale: es })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>Sin datos</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="h-6 border-border/50 px-2 text-[11px] font-normal">
            <ClipboardList className="mr-1 h-3 w-3" />
            {control.task_cards?.length ?? 0} tasks
          </Badge>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
              <Edit className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ControlCardViewProps {
  controls: ComputedControl[];
  onSelectControl: (id: number) => void;
  averages: AircraftAverageMetric | null;
}

export function ControlCardView({ controls, onSelectControl, averages }: ControlCardViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {controls.map((computed) => (
        <ControlCard
          key={computed.control.id}
          computed={computed}
          onSelect={() => onSelectControl(computed.control.id)}
          averages={averages}
        />
      ))}
    </div>
  );
}
