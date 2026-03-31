'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { maintenanceControlsIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import { Plus, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AircraftSelector } from './_components/aircraft-selector';
import { ControlSelector } from './_components/control-selector';
import { StatsCards } from './_components/stats-cards';
import { TasksTable } from './_components/tasks-table';
import { UpcomingTasks } from './_components/upcoming-tasks';

export default function MaintenanceDashboard() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);

  const { data: aircraft = [], isLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: {
        aircraft_id: selectedAircraftId ?? undefined,
      },
    }),
    enabled: !!selectedAircraftId,
  });

  const controls = controlsResponse?.data ?? [];

  const selectedAircraft = useMemo(() => {
    return aircraft.find((ac) => ac.id === selectedAircraftId) ?? null;
  }, [aircraft, selectedAircraftId]);

  const controlsForAircraft = useMemo(() => {
    if (!selectedAircraft) return [];
    return controls.filter((c) => c.aircrafts?.some((ac) => ac.id === selectedAircraft.id));
  }, [controls, selectedAircraft]);

  const selectedControl = useMemo(() => {
    return controlsForAircraft.find((c) => c.id === selectedControlId) ?? null;
  }, [controlsForAircraft, selectedControlId]);

  const handleSelectAircraft = (id: number) => {
    setSelectedAircraftId(id);
    setSelectedControlId(null);
  };

  if (isLoading || isControlsLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Control Mantenimiento">
      <main className="p-4 lg:p-6 max-w-[2080px]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">Control de Mantenimiento</h2>
              {selectedAircraft && (
                <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                  {selectedAircraft.acronym}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedAircraft
                ? `${selectedAircraft.manufacturer?.name ?? ''} ${selectedAircraft.aircraft_type?.series ?? ''} — S/N ${selectedAircraft.serial}`
                : 'Selecciona una aeronave para inspeccionar sus programas de mantenimiento'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="gap-2">
              <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/nuevo`}>
                <Plus className="h-4 w-4" />
                Nuevo Control
              </Link>
            </Button>
            <Settings2 className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </div>

        <StatsCards
          aircraft={aircraft}
          controls={controls}
          selectedAircraft={selectedAircraft}
          controlsForAircraft={controlsForAircraft}
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <AircraftSelector
              aircraft={aircraft}
              controls={controls}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={handleSelectAircraft}
            />
          </div>

          <div className="lg:col-span-6 space-y-4">
            <ControlSelector
              controls={controlsForAircraft}
              selectedControlId={selectedControlId}
              onSelectControl={setSelectedControlId}
            />

            {selectedControl ? (
              <TasksTable tasks={selectedControl.task_cards} controlName={selectedControl.title} />
            ) : selectedAircraft ? (
              <Card className="border-border/60 bg-card">
                <CardContent className="py-10">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Settings2 className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      Selecciona un control para ver sus task cards
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="lg:col-span-3">
            <UpcomingTasks />
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}
