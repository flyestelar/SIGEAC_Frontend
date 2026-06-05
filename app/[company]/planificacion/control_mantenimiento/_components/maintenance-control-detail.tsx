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

  const tasksCount = control.task_cards?.length ?? 0;

  return (
    <div className="space-y-4">
      <SelectedControlHeader computed={computedControl} onBack={onBack} />
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="h-9 w-full justify-start gap-1 rounded-md border border-border/60 bg-muted/30 p-1 sm:w-auto">
          <TabsTrigger
            value="tasks"
            className="gap-2 px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            Tasks
            {tasksCount > 0 && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground data-[state=active]:bg-primary/10">
                {tasksCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="estimaciones"
            className="px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            Gráficas
          </TabsTrigger>
          <TabsTrigger
            value="ejecuciones"
            className="px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            Últimos Cumplimientos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <TasksTable tasks={control.task_cards} controlName={control.title} />
        </TabsContent>
        <TabsContent value="estimaciones" className="mt-4">
          <EstimationsPanel control={control} aircraft={aircraft} />
        </TabsContent>
        <TabsContent value="ejecuciones" className="mt-4">
          <ExecutionsTable controlId={control.id} controlName={control.title} selectedAircraftId={selectedAircraftId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
