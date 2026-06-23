'use client';

import SectionHeader from '@/components/layout/SectionHeader';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftResource } from '@api/types';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { AircraftSelectField } from './aircraft-select-field';
import {
  AlertBadge,
  ComputedControl,
  EnCursoBadge,
  LEVEL_CONFIG,
  METRIC_ICONS,
  METRIC_UNITS,
} from './control-grid-shared';

// ── SelectedControlHeader ──────────────────────────────────────────────────────

interface SelectedControlHeaderProps {
  computed: ComputedControl;
  onBack: () => void;
  aircraft: AircraftResource[];
  selectedAircraftId: number | null;
  onSelectAircraft: (id: number) => void;
}

export function SelectedControlHeader({
  computed,
  onBack,
  aircraft,
  selectedAircraftId,
  onSelectAircraft,
}: SelectedControlHeaderProps) {
  const { selectedCompany } = useCompanyStore();
  const { control, metrics, status } = computed;
  const cfg = LEVEL_CONFIG[status];
  const LevelIcon = cfg.icon;

  return (
    <div>
      <SectionHeader
        title={control.title}
        subtitle={control.manual_reference}
        titleIcon={
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${cfg.iconBg}`}>
            <LevelIcon className={`h-3 w-3 ${cfg.iconText}`} />
          </div>
        }
        onBack={onBack}
        actions={
          <>
            <AircraftSelectField
              aircraft={aircraft}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={onSelectAircraft}
            />
            {control.in_progress && <EnCursoBadge workOrderLabel={control.last_execution?.work_order?.order_number} />}
            <AlertBadge status={status} size="small" />
            <Button asChild variant="ghost" size="icon" className="h-6 w-6">
              <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
                <Edit className="h-3 w-3" />
              </Link>
            </Button>
          </>
        }
      />

      {metrics.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {metrics.map((metric) => {
            const metricCfg = LEVEL_CONFIG[metric.status];
            const MetricIcon = METRIC_ICONS[metric.type];
            return (
              <div
                key={metric.type}
                className="flex flex-col gap-1 rounded-md border border-border/60 bg-muted/20 px-1.5 py-1.5 grow"
              >
                <div className="flex items-center gap-2">
                  <MetricIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    <span className={metricCfg.iconText}>{metric.consumed.toFixed(1)}</span>
                    <span className="text-muted-foreground">/{metric.interval}</span>
                    <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                      {METRIC_UNITS[metric.type]}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground ml-auto">
                    ({metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.)
                  </span>
                </div>
                <Progress
                  value={metric.percentage}
                  className="h-1.5 w-full"
                  indicatorClassName={metricCfg.progressIndicator}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
