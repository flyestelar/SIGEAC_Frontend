import { Card, CardContent } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';
import { ControlGrid } from './control-grid';
import { ExecutionsTable } from './executions-table';
import { TasksTable } from './tasks-table';
import { useQuery } from '@tanstack/react-query';
import { maintenanceControlsIndexOptions } from '@api/queries';
import { useMemo } from 'react';
import { AircraftResource } from '@api/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MaintenanceControlsSectionProps {
  selectedControlId: number | null;
  onSelectControl: (id: number | null) => void;
  selectedAircraft: AircraftResource | null;
  selectedAircraftId: number | null;
}

export function MaintenanceControlsSection({
  selectedControlId,
  onSelectControl,
  selectedAircraft,
  selectedAircraftId,
}: MaintenanceControlsSectionProps) {
  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: {
        aircraft_id: selectedAircraftId ?? undefined,
      },
    }),
    enabled: !!selectedAircraftId,
  });

  const controls = useMemo(() => controlsResponse?.data ?? [], [controlsResponse]);

  const controlsForAircraft = useMemo(() => {
    if (!selectedAircraft) return [];
    return controls.filter((c) => c.aircrafts?.some((ac) => ac.id === selectedAircraft.id));
  }, [controls, selectedAircraft]);

  const selectedControl = useMemo(() => {
    return controlsForAircraft.find((c) => c.id === selectedControlId) ?? null;
  }, [controlsForAircraft, selectedControlId]);

  return (
    <div className="lg:col-span-9 space-y-4">
      {isControlsLoading ? (
        <ControlGrid.Skeleton />
      ) : (
        <>
          <ControlGrid
            controls={controlsForAircraft}
            selectedControlId={selectedControlId}
            onSelectControl={onSelectControl}
            aircraftAcronym={selectedAircraft?.acronym ?? ''}
          />

          {selectedControl ? (
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="ejecuciones">Ejecuciones</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks">
                <TasksTable tasks={selectedControl.task_cards} controlName={selectedControl.title} />
              </TabsContent>
              <TabsContent value="ejecuciones">
                <ExecutionsTable controlId={selectedControl.id} controlName={selectedControl.title} />
              </TabsContent>
            </Tabs>
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
        </>
      )}
    </div>
  );
}
