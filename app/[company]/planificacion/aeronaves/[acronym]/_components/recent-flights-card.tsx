'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFlightControl } from '@/hooks/planificacion/useGetFlightsControl';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ArrowUpRight, MoveRight, PlaneTakeoff } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { formatDate, formatNumber, SectionCard, SectionHeader } from './shared';

const MAX_FLIGHTS = 6;

export function RecentFlightsCard({ aircraftId }: { aircraftId: number }) {
  const { selectedCompany } = useCompanyStore();
  const { data: flights, isLoading } = useGetFlightControl(selectedCompany?.slug);

  const recent = useMemo(() => {
    return (flights ?? [])
      .filter((f) => f.aircraft?.id === aircraftId)
      .sort((a, b) => new Date(b.flight_date).getTime() - new Date(a.flight_date).getTime())
      .slice(0, MAX_FLIGHTS);
  }, [flights, aircraftId]);

  return (
    <SectionCard>
      <SectionHeader icon={PlaneTakeoff} title="Últimos vuelos">
        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
          <Link href={`/${selectedCompany?.slug}/planificacion/control_vuelos/vuelos`}>
            Ver todos
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </SectionHeader>

      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 px-5 py-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : recent.length ? (
        <div className="divide-y">
          {recent.map((flight) => (
            <Link
              key={flight.id}
              href={`/${selectedCompany?.slug}/planificacion/control_vuelos/vuelos/${flight.id}`}
              className="block px-5 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{flight.origin}</span>
                    <MoveRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{flight.destination}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{flight.flight_number}</span> · {formatDate(flight.flight_date)}
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  <p>+{formatNumber(flight.flight_hours, 1)} FH</p>
                  <p>+{formatNumber(flight.flight_cycles)} FC</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
          <PlaneTakeoff className="h-8 w-8 opacity-20" />
          <p className="text-sm">Sin vuelos registrados</p>
        </div>
      )}
    </SectionCard>
  );
}
