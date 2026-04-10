'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AircraftAverageMetric } from '@api/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ComputedControl, computeMetricEstimation, EnCursoBadge } from './control-grid-shared';

interface ControlTableViewProps {
  averages: AircraftAverageMetric | null;
  controls: ComputedControl[];
  onSelectControl: (id: number) => void;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy', { locale: es });
}

function formatNumber(value: number | null | undefined, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function getClosestEstimatedMetric(metrics: ComputedControl['metrics'], averages: AircraftAverageMetric | null) {
  const estimated = metrics
    .map((metric) => {
      const estimation = computeMetricEstimation(metric, averages);
      if (!estimation) return null;

      let explanation = '';
      if (metric.type === 'DAYS') {
        explanation = 'Por intervalo calendario';
      } else if (metric.type === 'FH') {
        explanation = estimation.avg ? `Por promedio ${estimation.avg.toFixed(1)} FH/día` : 'Por FH restante';
      } else if (metric.type === 'FC') {
        explanation = estimation.avg ? `Por promedio ${estimation.avg.toFixed(1)} FC/día` : 'Por FC restante';
      }

      return { date: estimation.date, explanation };
    })
    .filter((item) => item !== null);

  if (estimated.length === 0) return null;

  return estimated.reduce((closest, item) => (item.date < closest.date ? item : closest), estimated[0]);
}

export function ControlTableView({ averages, controls, onSelectControl }: ControlTableViewProps) {
  return (
    <Card className="border-border/60 bg-card overflow-hidden">
      <CardContent className="px-0 pb-0 pt-0">
        <ScrollArea className="h-96">
          <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-10 bg-card [&_th]:border-b [&_th]:border-border/60">
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead
                  rowSpan={2}
                  className="border-x-0 pl-5 text-[10px] leading-tight font-semibold uppercase tracking-wide"
                >
                  Servicio
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="border-x-0 text-[10px] leading-tight font-semibold uppercase tracking-wide"
                >
                  Intervalo (FH)
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="border-x-0 text-[10px] leading-tight font-semibold uppercase tracking-wide"
                >
                  Intervalo (FC)
                </TableHead>
                <TableHead rowSpan={2} className="text-[10px] leading-tight font-semibold uppercase tracking-wide">
                  Intervalo (Días)
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="h-8 text-[10px] border-border/60 border-l leading-tight font-semibold uppercase tracking-wide"
                >
                  Último Cumplimiento
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="h-8 text-[10px] border-border/60 border-l leading-tight font-semibold uppercase tracking-wide"
                >
                  Próximo Cumplimiento
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="h-8 text-[10px] border-border/60 border-l leading-tight font-semibold uppercase tracking-wide"
                >
                  Remanente
                </TableHead>
              </TableRow>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40 tracking-wide uppercase">
                {/* Último cumplimiento */}
                <TableHead className="h-8 border-border/60 border-l text-[10px] leading-tight font-semibold ">
                  Fecha
                </TableHead>
                <TableHead className="h-8 text-[10px] leading-tight font-semibold">Horas</TableHead>
                <TableHead className="h-8 text-[10px] leading-tight font-semibold">Ciclos</TableHead>
                {/* Próximo cumplimiento */}
                <TableHead className="h-8 border-border/60 border-l pl-5 text-[10px] leading-tight font-semibold">
                  Fecha Estimada
                </TableHead>
                <TableHead className="h-8 text-[10px] leading-tight font-semibold">Horas</TableHead>
                <TableHead className="h-8 text-[10px] leading-tight font-semibold">Ciclos</TableHead>
                <TableHead className="border-border/60 border-l  h-8 text-[10px] leading-tight font-semibold">
                  FH
                </TableHead>
                <TableHead className="h-8 text-[10px] leading-tight font-semibold">FC</TableHead>
                <TableHead className="h-8 text-[10px] leading-tight font-semibold">Días</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr:last-child>td]:border-0 [&_td]:border-border/60 [&_td]:border-b">
              {controls.map((computed) => {
                const { control, metrics, isActive } = computed;
                const { interval_fh, interval_fc, interval_days } = control;
                const fhMetric = metrics.find((m) => m.type === 'FH');
                const fcMetric = metrics.find((m) => m.type === 'FC');
                const daysMetric = metrics.find((m) => m.type === 'DAYS');
                const remainingHrs = fhMetric?.remaining;
                const remainingFc = fcMetric?.remaining;
                const remainingDays = daysMetric?.remaining;
                const lastComplianceDate =
                  control.last_execution?.completed_at ?? control.last_execution?.executed_at ?? null;
                const lastComplianceHrs = control.last_execution?.current_fh;
                const lastComplianceFc = control.last_execution?.current_fc;
                const executionHrs =
                  interval_fh != null && lastComplianceHrs != null ? lastComplianceHrs + interval_fh : null;
                const executionFc =
                  interval_fc != null && lastComplianceFc != null ? lastComplianceFc + interval_fc : null;
                const estimatedMetric = getClosestEstimatedMetric(metrics, averages);

                return (
                  <TableRow
                    key={control.id}
                    className="cursor-pointer border-border/50"
                    onClick={() => onSelectControl(control.id)}
                  >
                    <TableCell className="pl-5">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none text-foreground">{control.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">{control.manual_reference || '-'}</p>
                        {isActive && <EnCursoBadge />}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(interval_fh, 1)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(interval_fc, 1)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(interval_days, 0)}</TableCell>
                    {/* Último cumplimiento */}
                    <TableCell className="font-mono text-xs">{formatDate(lastComplianceDate)}</TableCell>
                    <TableCell className="pr-5 font-mono text-xs">{formatNumber(lastComplianceHrs, 1)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(lastComplianceFc, 1)}</TableCell>
                    {/* Próximo cumplimiento */}
                    <TableCell className="pr-5">
                      <div className="space-y-1">
                        <p className="font-mono text-xs">{formatDate(estimatedMetric?.date)}</p>
                        <p className="text-[10px] leading-tight text-muted-foreground">
                          {estimatedMetric?.explanation ?? '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(executionHrs, 1)}</TableCell>
                    <TableCell className="font-mono text-xs">{formatNumber(executionFc, 1)}</TableCell>
                    <TableCell>
                      {remainingHrs !== null ? (
                        <Badge variant="outline" className="h-5 border-border/60 px-1.5 font-mono text-[10px]">
                          {formatNumber(remainingHrs, 1)}
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {remainingFc !== null ? (
                        <Badge variant="outline" className="h-5 border-border/60 px-1.5 font-mono text-[10px]">
                          {formatNumber(remainingFc, 1)}
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {remainingDays !== null ? (
                        <Badge variant="outline" className="h-5 border-border/60 px-1.5 font-mono text-[10px]">
                          {formatNumber(remainingDays, 0)}
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
