import type { AircraftAverageByDateRangeResponse } from '@api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarRange, Gauge, Layers } from 'lucide-react';

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface AircraftDailyAverageCardProps {
  average?: AircraftAverageByDateRangeResponse;
  isLoading?: boolean;
}

export function AircraftDailyAverageCard({ average, isLoading = false }: AircraftDailyAverageCardProps) {
  const avgHours = average?.metrics?.average_daily_flight_hours;
  const avgCycles = average?.metrics?.average_daily_flight_cycles;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarRange className="h-4 w-4" /> Promedio diario
        </CardTitle>
        <CardDescription className="text-xs">Horas y ciclos promedio por dia en el periodo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-dashed p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> FH / dia
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {typeof avgHours === 'number' ? avgHours.toFixed(2) : isLoading ? '...' : '—'}
            </p>
          </div>
          <div className="rounded-md border border-dashed p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> FC / dia
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {typeof avgCycles === 'number' ? avgCycles.toFixed(2) : isLoading ? '...' : '—'}
            </p>
          </div>
        </div>

        {average?.period ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{average.period.days_in_range.toFixed(0)} dias</Badge>
            <span>
              {formatDate(average.period.from)} - {formatDate(average.period.to)}
            </span>
          </div>
        ) : (
          !isLoading && <p className="text-xs text-muted-foreground">No hay datos de promedio para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}