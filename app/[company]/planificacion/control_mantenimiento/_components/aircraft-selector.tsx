"use client";

import { Plane, Clock, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "../_data/utils";
import { AircraftResource, MaintenanceControlResource } from "@api/types";

interface AircraftSelectorProps {
  aircraft: AircraftResource[];
  controls: MaintenanceControlResource[];
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

  const getAircraftStats = (ac: AircraftResource) => {
    const relatedControls = controls.filter((c) =>
      c.aircrafts?.some((a) => a.id === ac.id)
    );
    const totalTasks = relatedControls.reduce((sum, c) => sum + c.task_cards?.length!, 0);
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
          <div className="space-y-2 px-3 pb-3">
            {filtered.map((ac) => {
              const stats = getAircraftStats(ac);
              const isSelected = selectedAircraftId === ac.id;

              return (
                <button
                  key={ac.id}
                  onClick={() => onSelectAircraft(ac.id)}
                  className={`group w-full overflow-hidden rounded-lg border text-left transition-all ${isSelected
                    ? "border-primary/60 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-foreground/20"
                    }`}
                >
                  {/* Image */}
                  <div className="relative">
                    <img
                      src="https://cdn.zbordirect.com/images/airlines/ES.webp"
                      alt={ac.acronym ?? "Aircraft"}
                      className={cn("aspect-[16/7] w-full object-cover", isSelected ? "brightness-1" : "brightness-[0.5] dark:brightness-[0.4]")}
                    />
                    {/* Acronym overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold tracking-widest text-white">
                          {ac.acronym}
                        </span>
                        {isSelected && (
                          <Badge className="h-4 bg-primary/90 px-1.5 text-[9px] font-semibold text-primary-foreground">
                            Activa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {ac.manufacturer?.name ?? "—"}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        S/N {ac.serial || "—"}
                      </span>
                    </div>

                    {ac.aircraft_type?.series && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {ac.aircraft_type.full_name ?? ac.aircraft_type.series}
                      </p>
                    )}

                    <Separator className="!my-1.5" />

                    {/* Telemetry + stats */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {ac.flight_hours?.toLocaleString() ?? 0}
                        </span>
                        h
                      </span>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <RotateCcw className="h-3 w-3" />
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {ac.flight_cycles?.toLocaleString() ?? 0}
                        </span>
                        cyc
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {stats.totalControls}C / {stats.totalTasks}T
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <Plane className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  No se encontraron aeronaves
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
