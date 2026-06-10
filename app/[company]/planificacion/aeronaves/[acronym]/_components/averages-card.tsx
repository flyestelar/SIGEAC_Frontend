'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { AircraftAverageByDateRangeResponse } from '@api/types';
import { CalendarRange, Gauge, Layers } from 'lucide-react';
import React from 'react';
import { FieldLabel, formatDate, formatNumber, SectionCard, SectionHeader } from './shared';

function AverageCell({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="px-5 py-4">
      <FieldLabel className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </FieldLabel>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function AveragesCard({
  average,
  isLoading,
}: {
  average?: AircraftAverageByDateRangeResponse;
  isLoading?: boolean;
}) {
  const metrics = average?.metrics;
  const period = average?.period;

  return (
    <SectionCard>
      <SectionHeader icon={CalendarRange} title="Promedio de utilización" />

      {isLoading ? (
        <div className="grid grid-cols-2 divide-x">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-2 divide-x">
            <AverageCell
              icon={Gauge}
              label="FH / día"
              value={formatNumber(metrics.average_daily_flight_hours, 2)}
              detail={`${formatNumber(metrics.total_flight_hours, 1)} FH en el período`}
            />
            <AverageCell
              icon={Layers}
              label="FC / día"
              value={formatNumber(metrics.average_daily_flight_cycles, 2)}
              detail={`${formatNumber(metrics.total_flight_cycles)} FC en el período`}
            />
          </div>
          {period && (
            <p className="border-t px-5 py-2.5 text-xs text-muted-foreground">
              {metrics.flights_count} vuelos · {period.days_in_range} días · {formatDate(period.from)} al{' '}
              {formatDate(period.to)}
            </p>
          )}
        </>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin datos de utilización en el período.</p>
      )}
    </SectionCard>
  );
}
