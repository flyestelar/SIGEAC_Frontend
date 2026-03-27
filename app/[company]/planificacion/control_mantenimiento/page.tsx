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

export default function MaintenanceDashboard() {
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const { data: aircraft, isLoading, isError } = useGetMaintenanceAircrafts()
  const { data: controls, isLoading: isControlsLoading, isError: isControlsError } = useGetMaintenanceControl()
  return (
    <div>oajsd</div>
  )
}
