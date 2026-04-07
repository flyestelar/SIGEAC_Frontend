'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftAverageMetric, MaintenanceControlResource } from '@api/types';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarClock,
  Clock,
  ClipboardList,
  Edit,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
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

// ── Badge Components ─────────────────────────────────────────────────────

export function EnCursoBadge() {
  return (
    <Badge variant="outline" className="h-5 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-600 dark:text-sky-400">
      <Wrench className="mr-0.5 h-2.5 w-2.5" />
      En curso
    </Badge>
  );
}

export function AlertBadge({ status, size = 'small' }: { status: AlertLevel; size?: 'small' | 'medium' }) {
  const cfg = LEVEL_CONFIG[status];
  const sizeClasses = size === 'small' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-[11px]';
  return (
    <Badge variant="outline" className={`${sizeClasses} ${cfg.badgeClass}`}>
      {ALERT_LABELS[status]}
    </Badge>
  );
}

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

// ── Per-metric estimation helper ──────────────────────────────────────────────

type MetricEstimation = { date: Date; days: number; avg?: number } | null;

function computeMetricEstimation(
  metric: ComputedMetric,
  averages: { average_daily_flight_hours: number; average_daily_flight_cycles: number } | null,
): MetricEstimation {
  if (!averages || metric.remaining <= 0) return null;
  const now = new Date();
  let days: number | null = null;
  let avg: number | undefined;

  if (metric.type === 'DAYS') {
    days = metric.remaining;
  } else if (metric.type === 'FH' && averages.average_daily_flight_hours > 0) {
    days = metric.remaining / averages.average_daily_flight_hours;
    avg = averages.average_daily_flight_hours;
  } else if (metric.type === 'FC' && averages.average_daily_flight_cycles > 0) {
    days = metric.remaining / averages.average_daily_flight_cycles;
    avg = averages.average_daily_flight_cycles;
  }

  if (days === null || !isFinite(days)) return null;
  return { date: addDays(now, Math.ceil(days)), days, avg };
}

// ── ControlCard ────────────────────────────────────────────────────────────────

function ControlCard({
  computed,
  isSelected,
  onSelect,
  averages,
}: {
  computed: ComputedControl;
  isSelected: boolean;
  onSelect: () => void;
  averages: AircraftAverageMetric | null;
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
      <CardHeader className="space-y-2 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cfg.iconBg}`}>
              <LevelIcon className={`h-4 w-4 ${cfg.iconText}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-foreground">{control.title}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{control.manual_reference}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isActive && <EnCursoBadge />}
            <AlertBadge status={status} size="medium" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5 pt-0">
        {metrics.length > 0 && (
          <div className="grid auto-cols-fr grid-flow-col gap-2.5">
            {metrics.map((metric) => {
              const metricCfg = LEVEL_CONFIG[metric.status];
              const MetricIcon = METRIC_ICONS[metric.type];
              const estimation = averages ? computeMetricEstimation(metric, averages) : null;
              return (
                <div key={metric.type} className="rounded-md border border-border/50 bg-muted/15 px-3 py-2">
                  <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <MetricIcon className="h-3.5 w-3.5" />
                    {METRIC_LABELS[metric.type]}
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums">
                    <span className={metricCfg.iconText}>{metric.consumed.toFixed(1)}</span>
                    <span className="text-muted-foreground">/{metric.interval}</span>
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      {METRIC_UNITS[metric.type]}
                    </span>
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    ({metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.)
                  </p>
                  <Progress
                    value={metric.percentage}
                    className="mt-2 h-1.5"
                    indicatorClassName={metricCfg.progressIndicator}
                  />
                  {/* Próximo estimado inline */}
                  <div className="mt-2.5 border-t border-border/30 pt-2">
                    {estimation ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {format(estimation.date, 'dd MMM yy', { locale: es })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>Sin datos</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="h-6 border-border/50 px-2 text-[11px] font-normal">
            <ClipboardList className="mr-1 h-3 w-3" />
            {control.task_cards?.length ?? 0} tasks
          </Badge>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/${control.id}/editar`}>
              <Edit className="h-3.5 w-3.5" />
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
            {isActive && <EnCursoBadge />}
            <AlertBadge status={status} size="small" />
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
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ({metric.remaining.toFixed(1)} {METRIC_UNITS[metric.type]} rest.)
                  </span>
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
  averages: AircraftAverageMetric | null;
}

export function ControlGrid({ controls, selectedControlId, onSelectControl, aircraftAcronym, averages }: ControlGridProps) {
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
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {sortedControls.map((computed) => (
          <ControlCard
            key={computed.control.id}
            computed={computed}
            isSelected={false}
            onSelect={() => onSelectControl(computed.control.id)}
            averages={averages}
          />
        ))}
      </div>
    </div>
  );
}

ControlGrid.Skeleton = ControlGridSkeleton;
