"use client";

import { Plane, Clock, RotateCcw, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MaintenanceAircraft, MaintenanceControl } from "@/types";

interface AircraftSelectorProps {
  aircraft: MaintenanceAircraft[];
  controls: MaintenanceControl[];
  selectedAircraftId: number | null;
  onSelectAircraft: (id: number) => void;
}

export function AircraftSelector({
  aircraft,
  controls,
  selectedAircraftId,
  onSelectAircraft,
}: AircraftSelectorProps) {
  const getAircraftStats = (ac: MaintenanceAircraft) => {
    const relatedControls = controls.filter((c) =>
      c.aircrafts.some((a) => a.id === ac.id)
    );
    const totalTasks = relatedControls.reduce((sum, c) => sum + c.task_cards.length, 0);
    return {
      totalControls: relatedControls.length,
      totalTasks,
    };
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
          <Plane className="h-4 w-4 text-primary" />
          Flota de Aeronaves
          <Badge variant="outline" className="ml-auto border-border text-muted-foreground">
            {aircraft.length} activas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)] px-6 pb-6">
        <div className="space-y-3">
        {aircraft.map((ac) => {
          const stats = getAircraftStats(ac);
          const isSelected = selectedAircraftId === ac.id;

          return (
            <button
              key={ac.id}
              onClick={() => onSelectAircraft(ac.id)}
              className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isSelected ? "bg-primary/20" : "bg-primary/10"
                    }`}>
                    <Plane className={`h-6 w-6 ${isSelected ? "text-primary" : "text-primary/70"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{ac.acronym}</h3>
                    <p className="text-sm text-muted-foreground">{ac.manufacturer?.name}</p>
                    <p className="text-xs text-muted-foreground">{ac.serial}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${isSelected ? "rotate-90 text-primary" : ""
                    }`}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total FH</p>
                    <p className="font-semibold text-foreground">{ac.flight_hours?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total FC</p>
                    <p className="font-semibold text-foreground">{ac.flight_cycles?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
                  {stats.totalControls} controles
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary text-secondary-foreground">
                  {stats.totalTasks} tareas
                </Badge>
              </div>
            </button>
          );
        })}
        </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
