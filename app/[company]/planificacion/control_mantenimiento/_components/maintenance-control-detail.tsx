import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { useMemo } from 'react';
import { ComputedControl, computeMetrics, worstStatus } from './control-grid-shared';
import { SelectedControlHeader } from './control-header';
import { EstimationsPanel } from './estimations-panel';
import { ExecutionsTable } from './executions-table';
import { TasksTable } from './tasks-table';

interface MaintenanceControlDetailProps {
  control: MaintenanceControlResource;
  aircraft: AircraftResource | null;
  selectedAircraftId: number | null;
  onBack: () => void;
}

export function MaintenanceControlDetail({
  control,
  aircraft,
  selectedAircraftId,
  onBack,
}: MaintenanceControlDetailProps) {
  const computedControl = useMemo<ComputedControl>(() => {
    const metrics = computeMetrics(control);
    const status = worstStatus(metrics);
    return { control, metrics, status };
  }, [control]);

  return (
    <>
      <SelectedControlHeader computed={computedControl} onBack={onBack} />
      <Tabs defaultValue="tasks" className="w-full">
        <div className="flex justify-center">
          <TabsList className="mx-auto">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="estimaciones">Graficas</TabsTrigger>
            <TabsTrigger value="ejecuciones">Últimos Cumplimientos</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="tasks">
          <TasksTable tasks={control.task_cards} controlName={control.title} />
        </TabsContent>
        <TabsContent value="estimaciones">
          <EstimationsPanel control={control} aircraft={aircraft} />
        </TabsContent>
        <TabsContent value="ejecuciones">
          <ExecutionsTable controlId={control.id} controlName={control.title} selectedAircraftId={selectedAircraftId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
