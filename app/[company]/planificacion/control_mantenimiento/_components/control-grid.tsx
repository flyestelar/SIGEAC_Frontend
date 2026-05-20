'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AircraftAverageMetric, MaintenanceControlResource } from '@api/types';
import { BookOpen, ClipboardList, LayoutGrid, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AircraftAverageSummaryCard } from './aircraft-average-summary-card';
import { ControlCardView } from './control-card-view';
import { ComputedControl, LEVEL_PRIORITY, computeMetrics, worstStatus } from './control-grid-shared';
import { ControlTableView } from './control-table-view';

// ── Loading skeleton ───────────────────────────────────────────────────────────

function ControlGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-l-4 border-l-muted">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Skeleton className="mt-0.5 h-6 w-6 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-16" />
            <div className="grid auto-cols-fr grid-flow-col gap-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="space-y-1.5 rounded-md border border-border/40 bg-muted/10 px-2 py-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ControlGridProps {
  controls: MaintenanceControlResource[];
  onSelectControl: (id: number | null) => void;
  averages: AircraftAverageMetric | null;
}

export function ControlGrid({ controls, onSelectControl, averages }: ControlGridProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const computedControls = useMemo<ComputedControl[]>(() => {
    return controls.map((control) => {
      const metrics = computeMetrics(control);
      const status = worstStatus(metrics);
      return { control, metrics, status };
    });
  }, [controls]);

  const sortedControls = useMemo(() => {
    return [...computedControls].sort((a, b) => LEVEL_PRIORITY[a.status] - LEVEL_PRIORITY[b.status]);
  }, [computedControls]);

  if (controls.length === 0) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Selecciona una aeronave para ver sus controles
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Los controles de mantenimiento se filtran por aeronave seleccionada
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Grid state: show all controls ──
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <AircraftAverageSummaryCard averages={averages} />

        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Controles de Mantenimiento
          </span>
          <Badge variant="secondary" className="ml-1 font-mono text-xs">
            {controls.length}
          </Badge>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'cards' || value === 'table') {
                setViewMode(value);
              }
            }}
            variant="outline"
            size="sm"
            className="rounded-md border border-border/60 bg-background p-1 ml-auto"
            aria-label="Alternar vista de controles"
          >
            <ToggleGroupItem size="sm" value="cards" variant="outline">
              <LayoutGrid className="h-3.5 w-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="table" variant="outline">
              <Table2 className="h-3.5 w-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {viewMode === 'table' ? (
          <ControlTableView controls={sortedControls} onSelectControl={onSelectControl} averages={averages} />
        ) : (
          <ControlCardView controls={sortedControls} onSelectControl={onSelectControl} averages={averages} />
        )}
      </div>
    </div>
  );
}

ControlGrid.Skeleton = ControlGridSkeleton;
