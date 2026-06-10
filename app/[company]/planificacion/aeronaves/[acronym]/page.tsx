'use client';

import { HardTimeComponentsCard } from '@/components/cards/planificacion/HardTimeComponentsCard';
import { InstallationHistoryCard } from '@/components/cards/planificacion/InstallationHistoryCard';
import { SimpleEditAirplaneDialog } from '@/components/dialogs/planificacion/SimpleEditAirplaneDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { useGetAircraftDailyAverage } from '@/hooks/planificacion/useGetAircraftDailyAverage';
import { useGetMaintenanceAircraftByAcronym } from '@/hooks/planificacion/useGetMaitenanceAircraftByAcronym';
import { useCompanyStore } from '@/stores/CompanyStore';
import { FileText, Plane } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AircraftHeader } from './_components/aircraft-header';
import { AveragesCard } from './_components/averages-card';
import { MaintenanceControlsCard } from './_components/maintenance-controls-card';
import { RecentFlightsCard } from './_components/recent-flights-card';
import { SectionCard, SectionHeader } from './_components/shared';

export default function AircraftDetailsPage() {
  const { acronym } = useParams<{ acronym: string }>();
  const decodedAcronym = decodeURIComponent(acronym);
  const { selectedCompany } = useCompanyStore();
  const {
    data: aircraft,
    isLoading,
    isError,
  } = useGetMaintenanceAircraftByAcronym(decodedAcronym, selectedCompany?.slug);
  const { data: aircraftDailyAverage, isLoading: isDailyAverageLoading } = useGetAircraftDailyAverage(
    decodedAcronym,
    undefined,
    !!selectedCompany?.slug,
  );
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  if (isLoading) return <LoadingPage />;

  if (isError || !aircraft) {
    return (
      <ContentLayout>
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <Plane className="size-10 opacity-20" />
          <p className="text-sm">
            No se encontró la aeronave <span className="font-mono font-medium">{decodedAcronym}</span>.
          </p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout>
      <div className="mx-auto max-w-7xl space-y-4">
        <AircraftHeader aircraft={aircraft} onEdit={() => setIsTypeDialogOpen(true)} />
        <SimpleEditAirplaneDialog
          isOpen={isTypeDialogOpen}
          onOpenChange={setIsTypeDialogOpen}
          acronym={aircraft.acronym}
          companySlug={selectedCompany?.slug || ''}
          currentTypeId={aircraft.aircraft_type?.id}
          currentFlightHours={aircraft.flight_hours}
          currentFlightCycles={aircraft.flight_cycles}
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          {/* Main column */}
          <div className="space-y-4 lg:col-span-8">
            <MaintenanceControlsCard aircraftId={aircraft.id} averages={aircraft.last_average_metric ?? null} />
            <HardTimeComponentsCard aircraft={aircraft} />
            <InstallationHistoryCard aircraftId={aircraft.id} />
          </div>

          {/* Side column */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:col-span-4">
            <AveragesCard average={aircraftDailyAverage} isLoading={isDailyAverageLoading} />
            <RecentFlightsCard aircraftId={aircraft.id} />

            <SectionCard>
              <SectionHeader icon={FileText} title="Notas" description="Comentarios y observaciones" />
              <div className="p-5">
                {aircraft.comments?.trim() ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{aircraft.comments}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin comentarios.</p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
