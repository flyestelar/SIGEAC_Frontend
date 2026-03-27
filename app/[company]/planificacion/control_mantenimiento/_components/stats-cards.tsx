"use client";

import { Plane, ClipboardList, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Aircraft } from "../_data/types";

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
  aircraft: Aircraft[];
  selectedAircraft?: Aircraft | null;
}

export function StatsCards({ aircraft, selectedAircraft }: StatsCardsProps) {
  const targetAircraft = selectedAircraft ? [selectedAircraft] : aircraft;
  
  const totalTasks = targetAircraft.flatMap((ac) => ac.controls.flatMap((c) => c.tasks));
  const criticalTasks = totalTasks.filter((t) => t.status === "critical").length;
  const warningTasks = totalTasks.filter((t) => t.status === "warning").length;
  const okTasks = totalTasks.filter((t) => t.status === "ok").length;
  const totalControls = targetAircraft.flatMap((ac) => ac.controls).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={selectedAircraft ? "Aeronave Seleccionada" : "Aeronaves Activas"}
        value={selectedAircraft ? selectedAircraft.registration : aircraft.length}
        subtitle={selectedAircraft ? selectedAircraft.model : "En servicio"}
        icon={<Plane className="h-5 w-5" />}
      />
      <StatCard
        title="Tareas Totales"
        value={totalTasks.length}
        subtitle={`En ${totalControls} controles`}
        icon={<ClipboardList className="h-5 w-5" />}
      />
      <StatCard
        title="Atención Requerida"
        value={criticalTasks + warningTasks}
        subtitle={`${criticalTasks} críticas, ${warningTasks} próximas`}
        icon={<AlertTriangle className="h-5 w-5" />}
        variant="warning"
      />
      <StatCard
        title="En Estado OK"
        value={okTasks}
        subtitle="Sin acciones pendientes"
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
      />
    </div>
  );
}
