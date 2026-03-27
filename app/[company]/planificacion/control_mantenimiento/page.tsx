"use client";

import { useState, useMemo } from "react";
import { StatsCards } from "./_components/stats-cards";
import { AircraftSelector } from "./_components/aircraft-selector";
import { ControlSelector } from "./_components/control-selector";
import { TasksTable } from "./_components/tasks-table";
import { UpcomingTasks } from "./_components/upcoming-tasks";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { useGetMaintenanceAircrafts } from "@/hooks/planificacion/useGetMaintenanceAircrafts";
import { useGetMaintenanceControl } from "@/hooks/planificacion/control_mantenimiento/useGetMaintenanceControl";
import { useCompanyStore } from "@/stores/CompanyStore";
import LoadingPage from "@/components/misc/LoadingPage";

export default function MaintenanceDashboard() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);

  const { data: aircraft = [], isLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: controlsResponse, isLoading: isControlsLoading } = useGetMaintenanceControl();

  const controls = controlsResponse?.data ?? [];

  const selectedAircraft = useMemo(() => {
    return aircraft.find((ac) => ac.id === selectedAircraftId) ?? null;
  }, [aircraft, selectedAircraftId]);

  const controlsForAircraft = useMemo(() => {
    if (!selectedAircraft) return [];
    return controls.filter((c) =>
      c.aircrafts.some((ac) => ac.id === selectedAircraft.id)
    );
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
      <main className="p-6 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Panel de Control de Mantenimiento
          </h2>
          <p className="mt-1 text-muted-foreground">
            {selectedAircraft
              ? `Gestión de mantenimiento para ${selectedAircraft.acronym} - ${selectedAircraft.manufacturer?.name ?? ''}`
              : "Selecciona una aeronave para ver sus controles de mantenimiento"
            }
          </p>
        </div>

        <StatsCards
          aircraft={aircraft}
          controls={controls}
          selectedAircraft={selectedAircraft}
          controlsForAircraft={controlsForAircraft}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3 space-y-6">
            <AircraftSelector
              aircraft={aircraft}
              controls={controls}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={handleSelectAircraft}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <ControlSelector
              controls={controlsForAircraft}
              selectedControlId={selectedControlId}
              onSelectControl={setSelectedControlId}
            />

            {selectedControl ? (
              <TasksTable
                tasks={selectedControl.task_cards}
                controlName={selectedControl.title}
              />
            ) : selectedAircraft ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-card">
                <p className="text-muted-foreground">
                  Selecciona un control de mantenimiento para ver sus tareas
                </p>
              </div>
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
