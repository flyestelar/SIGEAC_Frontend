'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCompanyStore } from '@/stores/CompanyStore';
import { MaintenanceControlResource } from '@api/types';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarClock,
  Clock,
  ClipboardList,
  Edit,
  FileText,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useCallback, useState } from 'react';
import { useGetAircraftAverage } from '@/hooks/planificacion/useGetAircraftDailyAverage';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────────

type AlertLevel = 'OVERDUE' | 'WARNING' | 'OK';
type MetricType = 'FH' | 'FC' | 'DAYS';

type ComputedMetric = {
  type: MetricType;
  consumed: number;
  interval: number;
  remaining: number;
  percentage: number;
  status: AlertLevel;
};

type ComputedControl = {
  control: MaintenanceControlResource;
  metrics: ComputedMetric[];
  status: AlertLevel;
  isActive: boolean;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const ALERT_LABELS: Record<AlertLevel, string> = {
  OVERDUE: 'Vencido',
  WARNING: 'Próximo',
  OK: 'En tiempo',
};

const METRIC_LABELS: Record<MetricType, string> = {
  FH: 'Horas',
  FC: 'Ciclos',
  DAYS: 'Calendario',
};

const METRIC_UNITS: Record<MetricType, string> = {
  FH: 'FH',
  FC: 'FC',
  DAYS: 'días',
};

const METRIC_ICONS: Record<MetricType, typeof Clock> = {
  FH: Clock,
  FC: RefreshCw,
  DAYS: Calendar,
};

const INTERVAL_KEYS: Record<MetricType, 'interval_fh' | 'interval_fc' | 'interval_days'> = {
  FH: 'interval_fh',
  FC: 'interval_fc',
  DAYS: 'interval_days',
};

const SINCE_LAST_KEYS: Record<MetricType, 'fh' | 'fc' | 'days'> = {
  FH: 'fh',
  FC: 'fc',
  DAYS: 'days',
};

const ALL_METRIC_TYPES: MetricType[] = ['FH', 'FC', 'DAYS'];

const LEVEL_CONFIG: Record<
  AlertLevel,
  {
    icon: typeof TriangleAlert;
    cardBorder: string;
    cardBg: string;
    iconBg: string;
    iconText: string;
    progressIndicator: string;
    badgeClass: string;
  }
> = {
  OVERDUE: {
    icon: TriangleAlert,
    cardBorder: 'border-l-4 border-l-red-500 border-red-500/20',
    cardBg: 'bg-red-500/5 dark:bg-red-950/20',
    iconBg: 'bg-red-500/10 border border-red-500/20',
    iconText: 'text-red-600 dark:text-red-400',
    progressIndicator: 'bg-red-500',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  WARNING: {
    icon: AlertTriangle,
    cardBorder: 'border-l-4 border-l-amber-500 border-amber-500/20',
    cardBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    iconBg: 'bg-amber-500/10 border border-amber-500/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    progressIndicator: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  OK: {
    icon: ShieldCheck,
    cardBorder: 'border-l-4 border-l-emerald-500 border-emerald-500/20',
    cardBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    progressIndicator: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  },
};

const LEVEL_PRIORITY: Record<AlertLevel, number> = { OVERDUE: 0, WARNING: 1, OK: 2 };

// ── Metric computation ─────────────────────────────────────────────────────────

function computeMetrics(control: MaintenanceControlResource): ComputedMetric[] {
  const metrics: ComputedMetric[] = [];
  if (!control.since_last) return metrics;

  for (const type of ALL_METRIC_TYPES) {
    const interval = control[INTERVAL_KEYS[type]];
    if (interval === null || interval === undefined || interval === 0) continue;

    const consumed = control.since_last[SINCE_LAST_KEYS[type]];
    const remaining = interval - consumed;
    const percentage = Math.min((consumed / interval) * 100, 100);

    let status: AlertLevel = 'OK';
    if (percentage >= 100) status = 'OVERDUE';
    else if (percentage >= 70) status = 'WARNING';

    metrics.push({ type, consumed, interval, remaining, percentage, status });
  }

  return metrics;
}

function worstStatus(metrics: ComputedMetric[]): AlertLevel {
  if (metrics.length === 0) return 'OK';
  return metrics.reduce<AlertLevel>(
    (worst, m) => (LEVEL_PRIORITY[m.status] < LEVEL_PRIORITY[worst] ? m.status : worst),
    'OK',
  );
}

// ── EstimatedDateCard (compact) ────────────────────────────────────────────────

function EstimatedDateCard({ acronym, metrics }: { acronym: string; metrics: ComputedMetric[] }) {
  const [requested, setRequested] = useState(false);
  const { data, isLoading } = useGetAircraftAverage(acronym, undefined, requested);

  const handleCalculate = useCallback(() => setRequested(true), []);

  const estimation = useMemo(() => {
    if (!data?.metrics) return null;
    const { average_daily_flight_hours, average_daily_flight_cycles } = data.metrics;
    let best: { date: Date; metric: ComputedMetric; days: number; avg?: number } | null = null;
    const now = new Date();

    for (const m of metrics) {
      if (m.remaining <= 0) continue;
      let days: number | null = null;
      let avg: number | undefined;

      if (m.type === 'DAYS') {
        days = m.remaining;
      } else if (m.type === 'FH' && average_daily_flight_hours > 0) {
        days = m.remaining / average_daily_flight_hours;
        avg = average_daily_flight_hours;
      } else if (m.type === 'FC' && average_daily_flight_cycles > 0) {
        days = m.remaining / average_daily_flight_cycles;
        avg = average_daily_flight_cycles;
      }

      if (days === null || !isFinite(days)) continue;
      if (!best || days < best.days) {
        best = { date: addDays(now, Math.ceil(days)), metric: m, days, avg };
      }
    }
    return best;
  }, [data, metrics]);

  const explanation = useMemo(() => {
    if (!estimation) return null;
    const rem = estimation.metric.remaining.toFixed(1);
    if (estimation.metric.type === 'FH' && estimation.avg) {
      return `${rem}h rest. / ${estimation.avg.toFixed(1)}h diarias`;
    }
    if (estimation.metric.type === 'FC' && estimation.avg) {
      return `${rem} ciclos rest. / ${estimation.avg.toFixed(1)} ciclos/día`;
    }
    return `${rem} días restantes`;
  }, [estimation]);

  return (
    <button
      type="button"
      onClick={handleCalculate}
      className="w-full rounded-md border border-border/40 bg-muted/15 px-3 py-2 text-left transition-colors hover:bg-muted/25"
    >
      <div className="flex items-start gap-2">
        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] text-muted-foreground">Próx. estimado</p>
          {!requested ? (
            <p className="text-[11px] font-medium text-foreground/80">Click para calcular</p>
          ) : isLoading ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Calculando...</span>
            </div>
          ) : estimation ? (
            <>
              <p className="font-mono text-[11px] font-medium">
                {format(estimation.date, 'dd MMM yyyy', { locale: es })}
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">{explanation}</p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/60">Sin datos</p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── ControlCard ────────────────────────────────────────────────────────────────

function ControlCard({
  computed,
  isSelected,
  onSelect,
  aircraftAcronym,
}: {
  computed: ComputedControl;
  isSelected: boolean;
  onSelect: () => void;
  aircraftAcronym: string;
}) {
  const { selectedCompany } = useCompanyStore();
  const { control, metrics, status, isActive } = computed;
  const cfg = LEVEL_CONFIG[status];
  const LevelIcon = cfg.icon;

  return (
    <Card
      className={`group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 ${cfg.cardBorder} ${cfg.cardBg}`}
      onClick={onSelect}
    >
      <CardHeader className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${cfg.iconBg}`}>
              <LevelIcon className={`h-3 w-3 ${cfg.iconText}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight text-foreground">{control.title}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{control.manual_reference}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isActive && (
              <Badge variant="outline" className="h-5 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-600 dark:text-sky-400">
                <Wrench className="mr-0.5 h-2.5 w-2.5" />
                En curso
              </Badge>
            )}
            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${cfg.badgeClass}`}>
              {ALERT_LABELS[status]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3 pt-0">
        {metrics.length > 0 && (
          <div className="grid auto-cols-fr grid-flow-col gap-1.5">
            {metrics.map((metric) => {
              const metricCfg = LEVEL_CONFIG[metric.status];
              const MetricIcon = METRIC_ICONS[metric.type];
              return (
                <div key={metric.type} className="rounded border border-border/50 bg-muted/15 px-1.5 py-1">
                  <p className="flex items-center gap-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    <MetricIcon className="h-2.5 w-2.5" />
                    {METRIC_LABELS[metric.type]}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] font-semibold tabular-nums">
                    <span className={metricCfg.iconText}>{metric.consumed.toFixed(1)}</span>
                    <span className="text-muted-foreground">/{metric.interval}</span>
                    <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                      {METRIC_UNITS[metric.type]}
                    </span>
                  </p>
                  <Progress
                    value={metric.percentage}
                    className="mt-1 h-1"
                    indicatorClassName={metricCfg.progressIndicator}
                  />
                </div>
              );
            })}
          </div>
        )}

        <EstimatedDateCard acronym={aircraftAcronym} metrics={metrics} />

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="h-4 border-border/50 px-1 text-[9px] font-normal">
            <ClipboardList className="mr-0.5 h-2 w-2" />
            {control.task_cards?.length ?? 0} tasks
          </Badge>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
              <Edit className="h-2.5 w-2.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── SelectedControlHeader ──────────────────────────────────────────────────────

function SelectedControlHeader({
  computed,
  onBack,
  aircraftAcronym,
}: {
  computed: ComputedControl;
  onBack: () => void;
  aircraftAcronym: string;
}) {
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
            {isActive && (
              <Badge variant="outline" className="h-5 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-600 dark:text-sky-400">
                <Wrench className="mr-0.5 h-2.5 w-2.5" />
                OT
              </Badge>
            )}
            <Badge variant="outline" className={`h-5 px-1.5 text-[10px] ${cfg.badgeClass}`}>
              {ALERT_LABELS[status]}
            </Badge>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-6 w-6"
            >
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
                <div key={metric.type} className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5">
                  <MetricIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    <span className={metricCfg.iconText}>{metric.consumed.toFixed(1)}</span>
                    <span className="text-muted-foreground">/{metric.interval}</span>
                    <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                      {METRIC_UNITS[metric.type]}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">({metric.percentage.toFixed(0)}%)</span>
                  <Progress value={metric.percentage} className="h-1.5 w-16" indicatorClassName={metricCfg.progressIndicator} />
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
  aircraftAcronym: string;
}

export function ControlGrid({ controls, selectedControlId, onSelectControl, aircraftAcronym }: ControlGridProps) {
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
        <SelectedControlHeader computed={selectedComputed} onBack={() => onSelectControl(null)} aircraftAcronym={aircraftAcronym} />
      </div>
    );
  }

  // ── Grid state: show all controls ──
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Controles de Mantenimiento
        </span>
        <Badge variant="secondary" className="ml-1 font-mono text-xs">
          {controls.length}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedControls.map((computed) => (
          <ControlCard
            key={computed.control.id}
            computed={computed}
            isSelected={false}
            onSelect={() => onSelectControl(computed.control.id)}
            aircraftAcronym={aircraftAcronym}
          />
        ))}
      </div>
    </div>
  );
}

ControlGrid.Skeleton = ControlGridSkeleton;
