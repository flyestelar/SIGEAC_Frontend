"use client";

import { useState, useMemo } from "react";
import { StatsCards } from "./_components/stats-cards";
import { AircraftSelector } from "./_components/aircraft-selector";
import { ControlSelector } from "./_components/control-selector";
import { TasksTable } from "./_components/tasks-table";
import { UpcomingTasks } from "./_components/upcoming-tasks";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useGetMaintenanceAircrafts } from "@/hooks/planificacion/useGetMaintenanceAircrafts";

export default function MaintenanceDashboard() {
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const { data: aircraft, isLoading, isError } = useGetMaintenanceAircrafts()
  const selectedAircraft = useMemo(() => {
    return aircraft.find((ac) => ac.id === selectedAircraftId) || null;
  }, [selectedAircraftId]);

  const selectedControl = useMemo(() => {
    if (!selectedAircraft) return null;
    return selectedAircraft.controls.find((c) => c.id === selectedControlId) || null;
  }, [selectedAircraft, selectedControlId]);

  const handleSelectAircraft = (id: string) => {
    setSelectedAircraftId(id);
    setSelectedControlId(null); // Reset control selection when aircraft changes
  };

  const allTasks = useMemo(() => {
    if (selectedAircraft) {
      return selectedAircraft.controls.flatMap((c) => c.tasks);
    }
    return aircraft.flatMap((ac) => ac.controls.flatMap((c) => c.tasks));
  }, [selectedAircraft]);

  return (
    <ContentLayout title="Control Mantenimiento">
      <main className="p-6 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Panel de Control de Mantenimiento
          </h2>
          <p className="mt-1 text-muted-foreground">
            {selectedAircraft
              ? `Gestión de mantenimiento para ${selectedAircraft.registration} - ${selectedAircraft.model}`
              : "Selecciona una aeronave para ver sus controles de mantenimiento"
            }
          </p>
        </div>

        <StatsCards aircraft={aircraft} selectedAircraft={selectedAircraft} />

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left sidebar - Aircraft Selection */}
          <div className="lg:col-span-3 space-y-6">
            <AircraftSelector
              aircraft={aircraft}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={handleSelectAircraft}
            />
          </div>

          {/* Center - Controls and Tasks */}
          <div className="lg:col-span-6 space-y-6">
            {/* Control Selector */}
            <ControlSelector
              controls={selectedAircraft?.controls || []}
              selectedControlId={selectedControlId}
              onSelectControl={setSelectedControlId}
            />

            {/* Tasks Table */}
            {selectedControl ? (
              <TasksTable
                tasks={selectedControl.tasks}
                controlName={selectedControl.name}
              />
            ) : selectedAircraft ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-card">
                <p className="text-muted-foreground">
                  Selecciona un control de mantenimiento para ver sus tareas
                </p>
              </div>
            ) : null}
          </div>

          {/* Right sidebar - Upcoming Tasks */}
          <div className="lg:col-span-3">
            <UpcomingTasks tasks={allTasks} />
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}
