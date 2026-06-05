'use client';

import { AircraftSelector } from '@/app/[company]/planificacion/control_mantenimiento/_components/aircraft-selector';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGetFlightControl } from '@/hooks/planificacion/useGetFlightsControl';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetAverageCyclesAndHours } from '@/hooks/planificacion/vuelos/useGetAverageCyclesAndHours';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getColumns } from './columns';
import { FlightControlPageHeader } from './_components/FlightControlPageHeader';
import { FlightsListCard } from './_components/FlightsListCard';
import { OperationalSummary } from './_components/OperationalSummary';

const FlightControlPage = () => {
  const { selectedCompany } = useCompanyStore();
  const companySlug = selectedCompany?.slug ?? '';
  const { data: flights, isLoading, isError } = useGetFlightControl(companySlug);
  const { data: aircrafts, isLoading: isAircraftsLoading } = useGetMaintenanceAircrafts(companySlug);

  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const defaultAircraftId = aircrafts?.length ? String(aircrafts[0].id) : '';
  const activeAircraftId = selectedAircraftId ?? defaultAircraftId;

  const activeAircraftAcronym = useMemo(() => {
    const selected = aircrafts?.find((a) => String(a.id) === activeAircraftId);
    return selected?.acronym ?? '';
  }, [aircrafts, activeAircraftId]);

  const {
    data: averageStats,
    isLoading: isLoadingAverageStats,
    isError: isErrorAverageStats,
  } = useGetAverageCyclesAndHours(activeAircraftAcronym);

  const columns = useMemo(() => getColumns(companySlug), [companySlug]);

  const activeFlights = useMemo(() => {
    if (!flights?.length || !activeAircraftId) return [];
    const id = Number(activeAircraftId);
    return flights.filter((f) => f.aircraft?.id === id);
  }, [flights, activeAircraftId]);

  const stats = useMemo(() => {
    const totalHours = activeFlights.reduce((acc, f) => acc + Number(f.flight_hours ?? 0), 0);
    const totalCycles = activeFlights.reduce((acc, f) => acc + Number(f.flight_cycles ?? 0), 0);
    return { count: activeFlights.length, totalHours, totalCycles };
  }, [activeFlights]);

  if (isLoading || isAircraftsLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Control de vuelos">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <FlightControlPageHeader defaultAircraftId={activeAircraftId} />

        <AircraftSelector
          aircraft={aircrafts ?? []}
          selectedAircraftId={activeAircraftId ? Number(activeAircraftId) : null}
          onSelectAircraft={(id) => setSelectedAircraftId(String(id))}
        />

        {isError && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudo cargar el listado</AlertTitle>
            <AlertDescription>Revisa la conexión con el servidor y vuelve a intentarlo.</AlertDescription>
          </Alert>
        )}

        {!!aircrafts?.length && flights && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <FlightsListCard flights={activeFlights} columns={columns} aircraftAcronym={activeAircraftAcronym} />
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-6">
              <OperationalSummary
                aircraftAcronym={activeAircraftAcronym}
                count={stats.count}
                totalHours={stats.totalHours}
                totalCycles={stats.totalCycles}
                averages={averageStats?.metrics}
                isAveragesLoading={isLoadingAverageStats}
                isAveragesError={isErrorAverageStats}
              />
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default FlightControlPage;
