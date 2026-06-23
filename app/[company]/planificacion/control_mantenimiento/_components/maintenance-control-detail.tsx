import { Tabs as TabsPrimitive } from 'radix-ui';
import { motion } from 'motion/react';
import { AircraftResource, MaintenanceControlResource } from '@api/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { EstimationsPanel } from './estimations-panel';
import { ExecutionsTable } from './executions-table';
import { TasksTable } from './tasks-table';

interface MaintenanceControlDetailProps {
  control: MaintenanceControlResource;
  aircraft: AircraftResource | null;
  selectedAircraftId: number | null;
}

export function MaintenanceControlDetail({ control, aircraft, selectedAircraftId }: MaintenanceControlDetailProps) {
  const tasksCount = control.task_cards?.length ?? 0;
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <TabsPrimitive.Root defaultValue="tasks" onValueChange={setActiveTab} className="flex flex-col gap-4 flex-1">
      <div className="relative border-b border-border/40">
        <TabsPrimitive.List className="-mb-px flex gap-0">
          <TabTrigger value="tasks" activeTab={activeTab}>
            Tasks
            {tasksCount > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                {tasksCount}
              </span>
            )}
          </TabTrigger>
          <TabTrigger value="estimaciones" activeTab={activeTab}>
            Gráficas
          </TabTrigger>
          <TabTrigger value="ejecuciones" activeTab={activeTab}>
            Últimos Cumplimientos
          </TabTrigger>
        </TabsPrimitive.List>
      </div>

      <TabsPrimitive.Content
        value="tasks"
        className="outline-none focus-visible:outline-none flex-1 [&:not([hidden])]:flex flex-col"
      >
        <TasksTable tasks={control.task_cards} controlName={control.title} />
      </TabsPrimitive.Content>
      <TabsPrimitive.Content
        value="estimaciones"
        className="outline-none focus-visible:outline-none flex-1 [&:not([hidden])]:flex flex-col"
      >
        <EstimationsPanel control={control} aircraft={aircraft} />
      </TabsPrimitive.Content>
      <TabsPrimitive.Content
        value="ejecuciones"
        className="outline-none focus-visible:outline-none flex-1 [&:not([hidden])]:flex flex-col"
      >
        <ExecutionsTable controlId={control.id} controlName={control.title} selectedAircraftId={selectedAircraftId} />
      </TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}

function TabTrigger({ value, activeTab, children }: { value: string; activeTab: string; children: React.ReactNode }) {
  const isActive = value === activeTab;

  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'relative inline-flex items-center whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors',
        'text-muted-foreground/70 hover:text-foreground/80',
        'data-[state=active]:text-foreground',
        'outline-none focus-visible:outline-none',
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-foreground"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </TabsPrimitive.Trigger>
  );
}
