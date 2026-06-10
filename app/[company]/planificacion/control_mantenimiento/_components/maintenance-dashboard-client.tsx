'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Button } from '@/components/ui/button';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { Plus, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { AircraftSelector } from './aircraft-selector';
import MaintenanceControlsSection from './maintenance-controls-section';

export default function MaintenanceDashboardClient({ company }: { company: string }) {
  const searchParams = useSearchParams();
  const { data: aircraft = [], isLoading } = useGetMaintenanceAircrafts(company);
  const selectedAircraftId = useMemo(() => {
    const aircraftId = searchParams.get('aircraft_id');
    if (!aircraftId) return null;

    const parsedAircraftId = Number(aircraftId);
    return Number.isNaN(parsedAircraftId) ? null : parsedAircraftId;
  }, [searchParams]);

  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);

  const handleSelectAircraft = useCallback(
    (id: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('aircraft_id', id.toString());
      window.history.replaceState(null, '', `?${params.toString()}`);
      setSelectedControlId(null);
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
    <ContentLayout title="Control Mantenimiento">
      <main className="p-4 lg:p-6 max-w-[2080px]">
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-foreground">Control de Mantenimiento</h2>

          <div className="flex items-center gap-2">
            <Button asChild className="gap-2">
              <Link href={`/${company}/planificacion/control_mantenimiento/nuevo`}>
                <Plus className="h-4 w-4" />
                Nuevo Control
              </Link>
            </Button>
            <Settings2 className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <AircraftSelector
            aircraft={aircraft}
            selectedAircraftId={selectedAircraftId}
            onSelectAircraft={handleSelectAircraft}
          />
          <MaintenanceControlsSection
            selectedControlId={selectedControlId}
            onSelectControl={setSelectedControlId}
            selectedAircraft={deferredSelectedAircraft}
            selectedAircraftId={deferredSelectedAircraftId}
          />
        </div>
      </main>
    </ContentLayout>
  );
}
