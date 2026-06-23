'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Button } from '@/components/ui/button';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo } from 'react';
import { AircraftSelectField } from './aircraft-select-field';
import MaintenanceControlsSection from './maintenance-controls-section';
import SectionHeader from '@/components/layout/SectionHeader';

export default function MaintenanceDashboardClient({ company }: { company: string }) {
  const searchParams = useSearchParams();
  const { data: aircraft = [], isLoading } = useGetMaintenanceAircrafts(company);
  const selectedAircraftId = useMemo(() => {
    const aircraftId = searchParams.get('aircraft_id');
    if (!aircraftId) return null;

    const parsedAircraftId = Number(aircraftId);
    return Number.isNaN(parsedAircraftId) ? null : parsedAircraftId;
  }, [searchParams]);

  const handleSelectAircraft = useCallback(
    (id: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('aircraft_id', id.toString());
      window.history.replaceState(null, '', `?${params.toString()}`);
    },
    [searchParams],
  );

  const deferredSelectedAircraftId = useDeferredValue(selectedAircraftId);

  const deferredSelectedAircraft = useMemo(
    () => aircraft.find((ac) => ac.id === deferredSelectedAircraftId) ?? null,
    [aircraft, deferredSelectedAircraftId],
  );

  if (isLoading) return <LoadingPage />;

  return (
    <ContentLayout>
      <main className="flex flex-col gap-4">
        <SectionHeader
          size="xl"
          title="Controles de Mantenimiento"
          subtitle="Visualiza y gestiona los controles de mantenimiento de la flota de aeronaves."
          actions={
            <>
              <AircraftSelectField
                aircraft={aircraft}
                selectedAircraftId={selectedAircraftId}
                onSelectAircraft={handleSelectAircraft}
              />
              <Button asChild className="gap-2">
                <Link href={`/${company}/planificacion/control_mantenimiento/nuevo`}>
                  <Plus className="h-4 w-4" />
                  Nuevo Control
                </Link>
              </Button>
            </>
          }
        />

        <MaintenanceControlsSection
          selectedAircraft={deferredSelectedAircraft}
          selectedAircraftId={deferredSelectedAircraftId}
          aircraftId={selectedAircraftId}
        />
      </main>
    </ContentLayout>
  );
}
