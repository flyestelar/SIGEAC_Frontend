'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGetFlightControl } from '@/hooks/planificacion/useGetFlightsControl';
import { useCompanyStore } from '@/stores/CompanyStore';
import { FlightControl } from '@/types';
import { AlertTriangle, ArrowLeft, Plane, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { FlightMetricsPanel } from '../_components/FlightMetricsPanel';
import { FlightStripHeader } from '../_components/FlightStripHeader';

export default function FlightControlDetailPage() {
  const params = useParams<{ company: string; flight_number: string }>();
  const { selectedCompany } = useCompanyStore();
  const companySlug = selectedCompany?.slug ?? params?.company ?? '';
  const flightNumber = decodeURIComponent(params?.flight_number ?? '');

  const { data: flights, isLoading, isError } = useGetFlightControl(companySlug);
  const flight = useMemo(
    () => flights?.find((f) => f.flight_number === flightNumber),
    [flights, flightNumber],
  );

  const backHref = `/${companySlug}/planificacion/control_vuelos/vuelos`;

  if (isLoading) return <LoadingPage />;

  return (
    <ContentLayout title={`Vuelo ${flightNumber}`}>
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <DetailHeader flightNumber={flightNumber} backHref={backHref} />

        {isError && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de conexión</AlertTitle>
            <AlertDescription>No se pudo cargar la información del vuelo.</AlertDescription>
          </Alert>
        )}

        {!isError && !flight && <FlightNotFound flightNumber={flightNumber} backHref={backHref} />}

        {flight && (
          <>
            <FlightStripHeader flight={flight} />
            <DetailBody flight={flight} />
          </>
        )}
      </div>
    </ContentLayout>
  );
}

interface DetailHeaderProps {
  flightNumber: string;
  backHref: string;
}

function DetailHeader({ flightNumber, backHref }: DetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-muted-foreground">
          <Link href={backHref} aria-label="Volver al listado">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Registro</span>
          <h1 className="font-mono text-2xl font-semibold leading-none tracking-tight text-foreground">
            {flightNumber}
          </h1>
        </div>
      </div>
    </div>
  );
}

function DetailBody({ flight }: { flight: FlightControl }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-8 space-y-5">
        <CrewSection flight={flight} />
      </div>
      <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-5">
        <FlightMetricsPanel flight={flight} />
      </div>
    </div>
  );
}

function CrewSection({ flight }: { flight: FlightControl }) {
  return (
    <section className="rounded-lg border bg-background">
      <header className="border-b px-4 py-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tripulación</h2>
      </header>
      <div className="px-4 py-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30 text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Piloto / Operador</p>
          <p className="text-sm font-medium">{flight.aircraft_operator || 'No registrado'}</p>
        </div>
      </div>
    </section>
  );
}

function FlightNotFound({ flightNumber, backHref }: { flightNumber: string; backHref: string }) {
  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted/30 text-muted-foreground">
          <Plane className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Sin registro para {flightNumber}</p>
          <p className="text-xs text-muted-foreground">El número puede haber cambiado o el vuelo fue eliminado.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={backHref}>Regresar al listado</Link>
        </Button>
      </div>
    </div>
  );
}
