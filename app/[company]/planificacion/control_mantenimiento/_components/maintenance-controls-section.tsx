import { ControlGrid } from './control-grid';
import { EstimationsPanel } from './estimations-panel';
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
    <div className="space-y-4">
      {isControlsLoading ? (
        <ControlGrid.Skeleton />
      ) : (
        <>
          <ControlGrid
            controls={controlsForAircraft}
            selectedControlId={selectedControlId}
            onSelectControl={onSelectControl}
            aircraftAcronym={selectedAircraft?.acronym ?? ''}
            averages={selectedAircraft?.last_average_metric ?? null}
          />

          {selectedControl && (
            <Tabs defaultValue="tasks" className="w-full">
              <div className="flex justify-center">
                <TabsList className="mx-auto">
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="estimaciones">Graficas</TabsTrigger>
                  <TabsTrigger value="ejecuciones">Ejecuciones</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="tasks">
                <TasksTable tasks={selectedControl.task_cards} controlName={selectedControl.title} />
              </TabsContent>
              <TabsContent value="estimaciones">
                <EstimationsPanel control={selectedControl} aircraft={selectedAircraft} />
              </TabsContent>
              <TabsContent value="ejecuciones">
                <ExecutionsTable
                  controlId={selectedControl.id}
                  controlName={selectedControl.title}
                  selectedAircraftId={selectedAircraftId}
                />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
