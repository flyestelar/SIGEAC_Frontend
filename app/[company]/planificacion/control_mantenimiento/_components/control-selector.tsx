"use client";

import { FileText, ChevronRight, Calendar, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MaintenanceControl } from "../_data/types";

interface ControlSelectorProps {
  controls: MaintenanceControl[];
  selectedControlId: string | null;
  onSelectControl: (id: string) => void;
}

export function ControlSelector({
  controls,
  selectedControlId,
  onSelectControl,
}: ControlSelectorProps) {
  const getTaskStats = (control: MaintenanceControl) => {
    const critical = control.tasks.filter((t) => t.status === "critical").length;
    const warning = control.tasks.filter((t) => t.status === "warning").length;
    return { critical, warning, total: control.tasks.length };
  };

  if (controls.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            Controles de Mantenimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Selecciona una aeronave para ver sus controles de mantenimiento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Controles de Mantenimiento
          <Badge variant="outline" className="ml-auto border-border text-muted-foreground">
            {controls.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {controls.map((control) => {
          const stats = getTaskStats(control);
          const isSelected = selectedControlId === control.id;

          return (
            <button
              key={control.id}
              onClick={() => onSelectControl(control.id)}
              className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{control.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {control.mpdReference}
                  </p>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isSelected ? "rotate-90 text-primary" : ""
                  }`}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {control.revision}
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
                  {stats.total} tareas
                </Badge>
                {stats.critical > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    {stats.critical} críticas
                  </Badge>
                )}
                {stats.warning > 0 && (
                  <Badge className="bg-warning text-warning-foreground">
                    {stats.warning} próximas
                  </Badge>
                )}
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  Fecha efectiva: {new Date(control.effectiveDate).toLocaleDateString("es-AR")}
                </p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
