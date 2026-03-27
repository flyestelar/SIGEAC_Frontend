"use client";

import { Plane, ClipboardList, FileText, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MaintenanceAircraft, MaintenanceControl } from "@/types";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "success";
}

function StatCard({ title, value, subtitle, icon, variant = "default" }: StatCardProps) {
  const variantClasses = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${variantClasses[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  aircraft: MaintenanceAircraft[];
  controls: MaintenanceControl[];
  selectedAircraft: MaintenanceAircraft | null;
  controlsForAircraft: MaintenanceControl[];
}

export function StatsCards({ aircraft, controls, selectedAircraft, controlsForAircraft }: StatsCardsProps) {
  const displayControls = selectedAircraft ? controlsForAircraft : controls;
  const totalTasks = displayControls.reduce((sum, c) => sum + c.task_cards.length, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={selectedAircraft ? "Aeronave Seleccionada" : "Aeronaves Activas"}
        value={selectedAircraft ? selectedAircraft.acronym : aircraft.length}
        subtitle={selectedAircraft ? (selectedAircraft.manufacturer?.name ?? '') : "En servicio"}
        icon={<Plane className="h-5 w-5" />}
      />
      <StatCard
        title="Controles"
        value={displayControls.length}
        subtitle={selectedAircraft ? `Para ${selectedAircraft.acronym}` : "Total en el sistema"}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatCard
        title="Tareas Totales"
        value={totalTasks}
        subtitle={`En ${displayControls.length} controles`}
        icon={<ClipboardList className="h-5 w-5" />}
      />
      <StatCard
        title="Aeronaves en Flota"
        value={aircraft.length}
        subtitle="Registradas"
        icon={<Wrench className="h-5 w-5" />}
        variant="success"
      />
    </div>
  );
}
