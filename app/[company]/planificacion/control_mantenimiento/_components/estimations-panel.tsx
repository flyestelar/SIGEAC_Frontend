'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Clock3, RefreshCw } from 'lucide-react';

interface EstimationsPanelProps {
  control: MaintenanceControlResource;
  aircraft: AircraftResource | null;
}

type EstimationMetric = {
  key: 'fh' | 'fc';
  title: string;
  unit: string;
  interval: number | null;
  consumed: number | null;
  averagePerDay: number | null;
};

function formatNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function buildEstimation(metric: EstimationMetric) {
  if (!metric.interval || metric.consumed === null || metric.consumed === undefined) {
    return null;
  }

  const remaining = metric.interval - metric.consumed;
  const averagePerDay = metric.averagePerDay ?? 0;

  if (remaining <= 0) {
    return {
      remaining,
      daysToDue: 0,
      estimatedDate: new Date(),
      averagePerDay,
      isOverdue: true,
    };
  }

  if (averagePerDay <= 0) {
    return {
      remaining,
      daysToDue: null,
      estimatedDate: null,
      averagePerDay,
      isOverdue: false,
    };
  }

  const daysToDue = Math.ceil(remaining / averagePerDay);

  return {
    remaining,
    daysToDue,
    estimatedDate: addDays(new Date(), daysToDue),
    averagePerDay,
    isOverdue: false,
  };
}

function EstimationCard({ metric }: { metric: EstimationMetric }) {
  const estimation = buildEstimation(metric);
  const Icon = metric.key === 'fh' ? Clock3 : RefreshCw;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{metric.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Fecha estimada según consumo promedio del aeronave</p>
            </div>
          </div>
          <Badge variant="outline">{metric.unit}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Intervalo</p>
            <p className="mt-1 text-lg font-semibold">{metric.interval ? formatNumber(metric.interval) : 'Sin dato'}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Consumido</p>
            <p className="mt-1 text-lg font-semibold">
              {metric.consumed !== null && metric.consumed !== undefined ? formatNumber(metric.consumed) : 'Sin dato'}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Restante</p>
            <p className="mt-1 text-lg font-semibold">
              {estimation ? formatNumber(estimation.remaining) : 'Sin dato'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/50 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Promedio diario del aeronave</p>
            <p className="mt-1 text-lg font-semibold">
              {estimation && estimation.averagePerDay > 0 ? `${formatNumber(estimation.averagePerDay)} ${metric.unit}/día` : 'Sin datos suficientes'}
            </p>
          </div>

          <div className="rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <p className="text-xs uppercase tracking-wide">Fecha estimada</p>
            </div>
            <p className="mt-2 text-lg font-semibold">
              {estimation?.estimatedDate ? format(estimation.estimatedDate, 'dd MMMM yyyy', { locale: es }) : 'Sin datos suficientes'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {estimation?.isOverdue
                ? 'El control ya alcanzó o superó el intervalo.'
                : estimation?.daysToDue !== null && estimation?.daysToDue !== undefined
                  ? `Estimado en ${estimation.daysToDue} día(s).`
                  : 'No se puede calcular sin promedio diario.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EstimationsPanel({ control, aircraft }: EstimationsPanelProps) {
  const metrics: EstimationMetric[] = [
    {
      key: 'fh',
      title: 'Horas de vuelo',
      unit: 'FH',
      interval: control.interval_fh ?? null,
      consumed: control.since_last?.fh ?? null,
      averagePerDay: aircraft?.last_average_metric?.average_daily_flight_hours ?? null,
    },
    {
      key: 'fc',
      title: 'Ciclos de vuelo',
      unit: 'FC',
      interval: control.interval_fc ?? null,
      consumed: control.since_last?.fc ?? null,
      averagePerDay: aircraft?.last_average_metric?.average_daily_flight_cycles ?? null,
    },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <EstimationCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}