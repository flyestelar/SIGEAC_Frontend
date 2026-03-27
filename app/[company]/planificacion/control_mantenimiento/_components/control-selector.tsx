"use client";

import { FileText, ChevronRight, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MaintenanceControl } from "@/types";

interface ControlSelectorProps {
  controls: MaintenanceControl[];
  selectedControlId: number | null;
  onSelectControl: (id: number) => void;
}

export function ControlSelector({
  controls,
  selectedControlId,
  onSelectControl,
}: ControlSelectorProps) {
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
          const isSelected = selectedControlId === control.id;

          return (
            <button
              key={control.id}
              onClick={() => onSelectControl(control.id)}
              className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{control.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {control.manual_reference}
                  </p>
                  {control.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {control.description}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${isSelected ? "rotate-90 text-primary" : ""
                    }`}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
                  {control.task_cards.length} tareas
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
                  {control.aircrafts.length} aeronaves
                </Badge>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
