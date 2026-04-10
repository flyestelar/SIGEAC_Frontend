'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AircraftAverageMetric } from '@api/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AircraftAverageSummaryCardProps {
  averages: AircraftAverageMetric | null;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy', { locale: es });
}

function formatNumber(value: number | null | undefined, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function AircraftAverageSummaryCard({ averages }: AircraftAverageSummaryCardProps) {
  return (
    <Card className="border-border/60 bg-background">
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 py-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Promedio de horas voladas por la aeronave
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatNumber(averages?.average_daily_flight_hours, 2)} FH/día
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Promedio de ciclos volados por la aeronave
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatNumber(averages?.average_daily_flight_cycles, 2)} FC/día
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Período de cálculo
          </p>
          <p className="text-sm font-semibold text-foreground">
            {averages ? `${formatDate(averages.from_date)} – ${formatDate(averages.to_date)}` : '-'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
