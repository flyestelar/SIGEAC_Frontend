'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftAverageMetric, MaintenanceControlResource } from '@api/types';
import { ArrowLeft, BookOpen, ClipboardList, Edit, LayoutGrid, Table2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ControlCardView } from './control-card-view';
import {
  AlertBadge,
  ComputedControl,
  EnCursoBadge,
  LEVEL_CONFIG,
  LEVEL_PRIORITY,
  METRIC_ICONS,
  METRIC_UNITS,
  computeMetrics,
  worstStatus,
} from './control-grid-shared';
import { ControlTableView } from './control-table-view';

// ── SelectedControlHeader ──────────────────────────────────────────────────────

function SelectedControlHeader({ computed, onBack }: { computed: ComputedControl; onBack: () => void }) {
  const { selectedCompany } = useCompanyStore();
  const { control, metrics, status, isActive } = computed;
  const cfg = LEVEL_CONFIG[status];
  const LevelIcon = cfg.icon;

  return (
    <Card className={`overflow-hidden ${cfg.cardBorder} ${cfg.cardBg}`}>
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${cfg.iconBg}`}>
              <LevelIcon className={`h-3 w-3 ${cfg.iconText}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{control.title}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{control.manual_reference}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isActive && <EnCursoBadge />}
            <AlertBadge status={status} size="small" />
            <Button asChild variant="ghost" size="icon" className="h-6 w-6">
              <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
                <Edit className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {metrics.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {metrics.map((metric) => {
              const metricCfg = LEVEL_CONFIG[metric.status];
              const MetricIcon = METRIC_ICONS[metric.type];
              return (
                <div
                  key={metric.type}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5"
                >
                  <MetricIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    <span className={metricCfg.iconText}>{metric.consumed.toFixed(1)}</span>
                    <span className="text-muted-foreground">/{metric.interval}</span>
                    <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                      {METRIC_UNITS[metric.type]}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ({metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.)
                  </span>
                  <Progress
                    value={metric.percentage}
                    className="h-1.5 w-16"
                    indicatorClassName={metricCfg.progressIndicator}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
  selectedControlId: number | null;
  onSelectControl: (id: number | null) => void;
  averages: AircraftAverageMetric | null;
}

export function ControlGrid({ controls, selectedControlId, onSelectControl, averages }: ControlGridProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const computedControls = useMemo<ComputedControl[]>(() => {
    return controls.map((control) => {
      const metrics = computeMetrics(control);
      const status = worstStatus(metrics);
      const isActive = control.last_execution?.status === 'IN_PROGRESS';
      return { control, metrics, status, isActive };
    });
  }, [controls]);

  const sortedControls = useMemo(() => {
    return [...computedControls].sort((a, b) => LEVEL_PRIORITY[a.status] - LEVEL_PRIORITY[b.status]);
  }, [computedControls]);

  const selectedComputed = useMemo(
    () => sortedControls.find((c) => c.control.id === selectedControlId) ?? null,
    [sortedControls, selectedControlId],
  );

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

  // ── Selected state: show header + tasks ──
  if (selectedComputed) {
    return (
      <div className="space-y-4">
        <SelectedControlHeader computed={selectedComputed} onBack={() => onSelectControl(null)} />
      </div>
    );
  }

  // ── Grid state: show all controls ──
  return (
    <div className="space-y-4">
      <div className="space-y-4">
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
          <ControlTableView controls={sortedControls} onSelectControl={onSelectControl} />
        ) : (
          <ControlCardView controls={sortedControls} onSelectControl={onSelectControl} averages={averages} />
        )}
      </div>
    </div>
  );
}

ControlGrid.Skeleton = ControlGridSkeleton;
