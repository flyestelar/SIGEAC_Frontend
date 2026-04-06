'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, RefreshCw, TrendingUp } from 'lucide-react';

interface ProjectionChartProps {
  metrics: {
    key: 'fh' | 'fc';
    label: string;
    unit: string;
    interval: number | null;
    consumed: number | null;
    averagePerDay: number | null;
  }[];
}

type DataPoint = {
  day: number;
  date: string;
  fh?: number;
  fc?: number;
  limitFh?: number;
  limitFc?: number;
};

type DueMarker = {
  key: 'fh' | 'fc';
  label: string;
  date: Date;
  days: number;
  color: string;
  percentage: number;
};

type ReferenceMetricLine = {
  key: 'fh' | 'fc';
  value: number;
  label: string;
};

type DaysRemainingDatum = {
  key: 'fh' | 'fc';
  label: string;
  value: number;
  maxValue: number;
  percentage: number;
  color: string;
};

const chartConfig = {
  fh: {
    label: 'Horas de vuelo',
    color: 'hsl(var(--primary))',
  },
  fc: {
    label: 'Ciclos de vuelo',
    color: 'hsl(210, 70%, 55%)',
  },
  limitFh: {
    label: 'Límite FH',
    color: 'hsl(0, 72%, 51%)',
  },
  limitFc: {
    label: 'Límite FC',
    color: 'hsl(0, 72%, 51%)',
  },
} satisfies ChartConfig;

const METRIC_ICONS = {
  fh: Clock,
  fc: RefreshCw,
} as const;

function getMetricColor(key: 'fh' | 'fc') {
  return key === 'fh' ? 'hsl(var(--primary))' : 'hsl(210, 70%, 55%)';
}

function formatChartDate(day: number) {
  return format(addDays(new Date(), day), 'dd MMM', { locale: es });
}

function getMetricUnit(name: string) {
  if (name === 'fh') return 'FH';
  if (name === 'fc') return 'FC';
  return '';
}

function isMetricSeries(name: string) {
  return name === 'fh' || name === 'fc';
}

function computeProjectionDays(metrics: ProjectionChartProps['metrics']): number {
  let maxDays = 90;

  for (const metric of metrics) {
    if (
      !metric.interval ||
      metric.consumed === null ||
      metric.consumed === undefined ||
      !metric.averagePerDay ||
      metric.averagePerDay <= 0
    ) {
      continue;
    }

    const remaining = metric.interval - metric.consumed;
    if (remaining <= 0) {
      continue;
    }

    const days = Math.ceil(remaining / metric.averagePerDay);
    maxDays = Math.max(maxDays, Math.ceil(days * 1.3));
  }

  return Math.min(maxDays, 730);
}

function getDueMarkers(metrics: ProjectionChartProps['metrics']): DueMarker[] {
  return metrics.flatMap((metric) => {
    if (
      !metric.interval ||
      metric.consumed === null ||
      metric.consumed === undefined ||
      !metric.averagePerDay ||
      metric.averagePerDay <= 0
    ) {
      return [];
    }

    const remaining = metric.interval - metric.consumed;
    const days = remaining <= 0 ? 0 : Math.ceil(remaining / metric.averagePerDay);
    const rawPercentage = (metric.consumed / metric.interval) * 100;

    return [
      {
        key: metric.key,
        label: metric.unit,
        date: addDays(new Date(), days),
        days,
        color: getMetricColor(metric.key),
        percentage: Math.min(Math.max(rawPercentage, 0), 100),
      },
    ];
  });
}

function getReferenceLines(metrics: ProjectionChartProps['metrics']): ReferenceMetricLine[] {
  return metrics.flatMap((metric) => {
    if (!metric.interval) return [];

    return [
      {
        key: metric.key,
        value: metric.interval,
        label: `Límite ${metric.unit}`,
      },
    ];
  });
}

function buildProjectionData(
  metrics: ProjectionChartProps['metrics'],
  projectionDays: number,
  stepDays: number,
  dueMarkers: DueMarker[],
): DataPoint[] {
  const pointDays = new Set<number>();

  for (let day = 0; day <= projectionDays; day += stepDays) {
    pointDays.add(day);
  }

  pointDays.add(projectionDays);
  dueMarkers.forEach((marker) => pointDays.add(Math.min(marker.days, projectionDays)));

  return Array.from(pointDays)
    .sort((a, b) => a - b)
    .map((day) => {
      const point: DataPoint = {
        day,
        date: formatChartDate(day),
      };

      for (const metric of metrics) {
        if (
          metric.consumed === null ||
          metric.consumed === undefined ||
          !metric.averagePerDay ||
          metric.averagePerDay <= 0
        ) {
          continue;
        }

        const projected = metric.consumed + metric.averagePerDay * day;
        point[metric.key] = Math.round(projected * 10) / 10;

        if (metric.interval) {
          const limitKey = metric.key === 'fh' ? 'limitFh' : 'limitFc';
          point[limitKey] = metric.interval;
        }
      }

      return point;
    });
}

function getAxisDomainMax(
  metrics: ProjectionChartProps['metrics'],
  key: 'fh' | 'fc',
  projectionDays: number,
) {
  const metric = metrics.find((item) => item.key === key);
  if (!metric || metric.consumed === null || !metric.averagePerDay || metric.averagePerDay <= 0) {
    return 'auto' as const;
  }

  const projectedMax = metric.consumed + metric.averagePerDay * projectionDays;
  return Math.max(metric.interval ?? 0, projectedMax) * 1.08;
}

function buildDueLabel(marker: DueMarker) {
  if (marker.days === 0) return `${marker.label} hoy`;
  return `${marker.label} ${format(marker.date, 'dd MMM', { locale: es })}`;
}

function buildDueBadgeText(marker: DueMarker) {
  if (marker.days === 0) return 'vence hoy';
  return `${format(marker.date, 'dd MMM yy', { locale: es })} (${marker.days}d)`;
}

function buildDueMarkersData(dueMarkers: DueMarker[]): DaysRemainingDatum[] {
  const maxValue = Math.max(...dueMarkers.map((marker) => Math.max(marker.days, 1)), 1);

  return dueMarkers.map((marker) => ({
    key: marker.key,
    label: marker.label,
    value: Math.max(marker.days, 0),
    maxValue,
    percentage: marker.days === 0 ? 100 : (Math.max(marker.days, 1) / maxValue) * 100,
    color: marker.color,
  }));
}

function DaysRemainingChart({ data }: { data: DaysRemainingDatum[] }) {
  if (data.length === 0) return null;

  return (
    <div className="grid gap-3 border-t border-border/40 px-5 py-4 md:grid-cols-2">
      {data.map((item) => (
        <div key={item.key} className="rounded-lg border border-border/50 bg-muted/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Dias restantes
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{item.label}</p>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[11px]"
              style={{ borderColor: `${item.color}40`, color: item.color }}
            >
              {item.value}d
            </Badge>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-[112px] w-[112px] shrink-0">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <RadialBarChart
                  data={[item]}
                  innerRadius="74%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  barSize={12}
                >
                  <PolarAngleAxis type="number" domain={[0, item.maxValue]} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={999} fill={item.color} />
                </RadialBarChart>
              </ChartContainer>
            </div>

            <div className="space-y-1">
              <p className="font-mono text-3xl font-semibold tabular-nums text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">dias hasta el vencimiento estimado</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{Math.round(item.percentage)}% del horizonte maximo</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectionChart({ metrics }: ProjectionChartProps) {
  const activeMetrics = metrics.filter(
    (metric) =>
      metric.consumed !== null &&
      metric.consumed !== undefined &&
      !!metric.averagePerDay &&
      metric.averagePerDay > 0 &&
      !!metric.interval,
  );

  const { data, dueMarkers, projectionDays, referenceLines } = useMemo(() => {
    if (activeMetrics.length === 0) {
      return {
        data: [],
        dueMarkers: [],
        projectionDays: 0,
        referenceLines: [],
      };
    }

    const nextProjectionDays = computeProjectionDays(activeMetrics);
    const stepDays =
      nextProjectionDays > 365 ? 14 : nextProjectionDays > 180 ? 7 : nextProjectionDays > 60 ? 3 : 1;
    const nextDueMarkers = getDueMarkers(activeMetrics);

    return {
      data: buildProjectionData(activeMetrics, nextProjectionDays, stepDays, nextDueMarkers),
      dueMarkers: nextDueMarkers,
      projectionDays: nextProjectionDays,
      referenceLines: getReferenceLines(activeMetrics),
    };
  }, [activeMetrics]);

  const daysRemainingData = useMemo(() => buildDueMarkersData(dueMarkers), [dueMarkers]);

  if (activeMetrics.length === 0) {
    return null;
  }

  const hasFh = activeMetrics.some((metric) => metric.key === 'fh');
  const hasFc = activeMetrics.some((metric) => metric.key === 'fc');
  const dualAxis = hasFh && hasFc;

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Proyeccion de consumo</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Basado en el promedio diario de la aeronave
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dueMarkers.map((marker) => {
              const MetricIcon = METRIC_ICONS[marker.key];
              return (
                <Badge
                  key={marker.key}
                  variant="outline"
                  className="gap-1.5 font-mono text-[11px]"
                  style={{ borderColor: `${marker.color}40`, color: marker.color }}
                >
                  <MetricIcon className="h-3 w-3" />
                  <span>{buildDueBadgeText(marker)}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        <Separator className="opacity-50" />

        <div className="px-5 py-4">
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
            <AreaChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientFh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradientFc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210, 70%, 55%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(210, 70%, 55%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="day"
                domain={[0, projectionDays]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickMargin={8}
                tickFormatter={formatChartDate}
              />

              {hasFh && (
                <YAxis
                  yAxisId="fh"
                  domain={[0, getAxisDomainMax(activeMetrics, 'fh', projectionDays)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickMargin={4}
                  width={50}
                  tickFormatter={(value) => `${value}`}
                />
              )}

              {dualAxis && hasFc && (
                <YAxis
                  yAxisId="fc"
                  orientation="right"
                  domain={[0, getAxisDomainMax(activeMetrics, 'fc', projectionDays)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickMargin={4}
                  width={50}
                  tickFormatter={(value) => `${value}`}
                />
              )}

              {!dualAxis && hasFc && (
                <YAxis
                  yAxisId="fc"
                  domain={[0, getAxisDomainMax(activeMetrics, 'fc', projectionDays)]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickMargin={4}
                  width={50}
                  tickFormatter={(value) => `${value}`}
                />
              )}

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as DataPoint | undefined;
                      return point ? point.date : '';
                    }}
                    formatter={(value, name) => {
                      if (!isMetricSeries(String(name))) return null;

                      return (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">{getMetricUnit(String(name))}</span>
                          <span className="font-mono font-semibold tabular-nums">{Number(value).toFixed(1)}</span>
                        </div>
                      );
                    }}
                  />
                }
              />

              {referenceLines.map((line) => (
                <ReferenceLine
                  key={line.key}
                  yAxisId={line.key}
                  y={line.value}
                  stroke="hsl(0, 72%, 51%)"
                  strokeDasharray="6 3"
                  strokeOpacity={0.6}
                  label={{
                    value: `${line.label} (${line.value})`,
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'hsl(0, 72%, 51%)',
                    fontWeight: 600,
                  }}
                />
              ))}

              {dueMarkers.map((marker) => (
                <ReferenceLine
                  key={`due-${marker.key}`}
                  yAxisId={marker.key}
                  x={marker.days}
                  stroke={marker.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.8}
                  ifOverflow="extendDomain"
                  label={{
                    value: buildDueLabel(marker),
                    position: 'top',
                    fontSize: 10,
                    fill: marker.color,
                    fontWeight: 700,
                  }}
                />
              ))}

              {hasFh && (
                <Area
                  yAxisId="fh"
                  type="monotone"
                  dataKey="fh"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gradientFh)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              )}

              {hasFc && (
                <Area
                  yAxisId="fc"
                  type="monotone"
                  dataKey="fc"
                  stroke="hsl(210, 70%, 55%)"
                  strokeWidth={2}
                  fill="url(#gradientFc)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-border/40 px-5 py-2.5">
          {hasFh && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="h-0.5 w-4 rounded-full bg-primary" />
              <span>FH proyectadas</span>
            </div>
          )}
          {hasFc && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: 'hsl(210, 70%, 55%)' }} />
              <span>FC proyectados</span>
            </div>
          )}
          {dueMarkers.map((marker) => (
            <div key={`legend-${marker.key}`} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="h-3 w-0 border-l-2 border-dashed" style={{ borderColor: marker.color }} />
              <span>Hito {marker.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <div className="h-0 w-4 border-t-2 border-dashed border-red-500/60" />
            <span>Limite de intervalo</span>
          </div>
        </div>

        <DaysRemainingChart data={daysRemainingData} />
      </CardContent>
    </Card>
  );
}
