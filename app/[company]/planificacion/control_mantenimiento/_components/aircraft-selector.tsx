"use client";

import { Plane, Clock, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");

  const getAircraftStats = (ac: MaintenanceAircraft) => {
    const relatedControls = controls.filter((c) =>
      c.aircrafts.some((a) => a.id === ac.id)
    );
    const totalTasks = relatedControls.reduce((sum, c) => sum + c.task_cards.length, 0);
    return { totalControls: relatedControls.length, totalTasks };
  };

  const filtered = aircraft.filter((ac) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ac.acronym?.toLowerCase().includes(q) ||
      ac.serial?.toLowerCase().includes(q) ||
      ac.manufacturer?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Plane className="h-4 w-4 text-primary" />
          Flota
          <Badge variant="secondary" className="ml-auto font-mono text-xs">
            {aircraft.length}
          </Badge>
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar aeronave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/40 border-border/60"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-340px)]">
          <div className="space-y-1 px-3 pb-3">
            {filtered.map((ac) => {
              const stats = getAircraftStats(ac);
              const isSelected = selectedAircraftId === ac.id;

              return (
                <button
                  key={ac.id}
                  onClick={() => onSelectAircraft(ac.id)}
                  className={`group w-full rounded-md border p-3 text-left transition-all ${isSelected
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border/60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors ${isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                      }`}>
                      <Plane className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {ac.acronym}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          S/N {ac.serial}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ac.manufacturer?.name} {ac.aircraft_type?.series ? `- ${ac.aircraft_type.series}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono font-medium text-foreground">{ac.flight_hours?.toLocaleString() ?? 0}</span>
                      FH
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <RotateCcw className="h-3 w-3" />
                      <span className="font-mono font-medium text-foreground">{ac.flight_cycles?.toLocaleString() ?? 0}</span>
                      FC
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {stats.totalControls}C / {stats.totalTasks}T
                    </span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No se encontraron aeronaves
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
