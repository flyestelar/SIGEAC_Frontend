"use client";

import { Plane, Clock, RotateCcw, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Aircraft } from "../_data/types";

interface AircraftSelectorProps {
  aircraft: Aircraft[];
  selectedAircraftId: string | null;
  onSelectAircraft: (id: string) => void;
}

export function AircraftSelector({
  aircraft,
  selectedAircraftId,
  onSelectAircraft,
}: AircraftSelectorProps) {
  const getAircraftStats = (ac: Aircraft) => {
    const allTasks = ac.controls.flatMap((c) => c.tasks);
    return {
      critical: allTasks.filter((t) => t.status === "critical").length,
      warning: allTasks.filter((t) => t.status === "warning").length,
      ok: allTasks.filter((t) => t.status === "ok").length,
      totalControls: ac.controls.length,
      totalTasks: allTasks.length,
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
      <CardContent className="space-y-3">
        {aircraft.map((ac) => {
          const stats = getAircraftStats(ac);
          const isSelected = selectedAircraftId === ac.id;
          const hasIssues = stats.critical > 0 || stats.warning > 0;

          return (
            <button
              key={ac.id}
              onClick={() => onSelectAircraft(ac.id)}
              className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    isSelected ? "bg-primary/20" : "bg-primary/10"
                  }`}>
                    <Plane className={`h-6 w-6 ${isSelected ? "text-primary" : "text-primary/70"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{ac.registration}</h3>
                      {hasIssues ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ac.model}</p>
                    <p className="text-xs text-muted-foreground">{ac.serialNumber}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isSelected ? "rotate-90 text-primary" : ""
                  }`}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total FH</p>
                    <p className="font-semibold text-foreground">{ac.totalFH.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total FC</p>
                    <p className="font-semibold text-foreground">{ac.totalFC.toLocaleString()}</p>
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
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
