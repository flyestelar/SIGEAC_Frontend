"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { MaintenanceAircraft } from "@/types";
import { MaintenanceControlResource } from "@api/types";
import {
  ClipboardList,
  FileText,
  Plane,
  Wrench
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: string;
}

function StatCard({ title, value, subtitle, icon, accent = "text-primary bg-primary/10" }: StatCardProps) {
  const [textColor, bgColor] = accent.split(" ");

  return (
    <Card className="border-border/60 bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
            <span className={textColor}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  aircraft: MaintenanceAircraft[];
  selectedAircraft: MaintenanceAircraft | null;
}

export function StatsCards({ aircraft,  selectedAircraft }: StatsCardsProps) {
  // const displayControls = selectedAircraft ? controlsForAircraft : controls;
  const displayControls = []
  // const totalTasks = displayControls.reduce((sum, c) => sum + (c.task_cards?.length ?? 0), 0);
  const totalTasks = 0

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={selectedAircraft ? "Aeronave" : "Flota"}
        value={selectedAircraft ? selectedAircraft.acronym : aircraft.length}
        subtitle={selectedAircraft ? (selectedAircraft.manufacturer?.name ?? 'Sin fabricante') : "Aeronaves en servicio"}
        icon={<Plane className="h-5 w-5" />}
      />
      <StatCard
        title="Controles"
        value={displayControls.length}
        subtitle={selectedAircraft ? `Asignados a ${selectedAircraft.acronym}` : "Programas registrados"}
        icon={<FileText className="h-5 w-5" />}
        accent="text-blue-500 bg-blue-500/10"
      />
      <StatCard
        title="Task Cards"
        value={totalTasks}
        subtitle={`En ${displayControls.length} controles`}
        icon={<ClipboardList className="h-5 w-5" />}
        accent="text-amber-500 bg-amber-500/10"
      />
      <StatCard
        title="Componentes"
        value={
          selectedAircraft
            ? selectedAircraft.aircraft_assignments?.length ?? 0
            : aircraft.reduce((sum, ac) => sum + (ac.aircraft_assignments?.length ?? 0), 0)
        }
        subtitle={selectedAircraft ? "Partes asignadas" : "Total en flota"}
        icon={<Wrench className="h-5 w-5" />}
        accent="text-emerald-500 bg-emerald-500/10"
      />
    </div>
  );
}
