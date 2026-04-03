'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { maintenanceControlsAlertsOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, ArrowLeft, Calendar, CalendarClock, Clock, FileText, Gauge, Plane, RefreshCw, Search, ShieldCheck, Siren, TriangleAlert, Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { addDays } from 'date-fns';
import { useMemo, useCallback, useState } from 'react';
import { useGetAircraftAverage } from '@/hooks/planificacion/useGetAircraftDailyAverage';
import { HoverCardPortal } from '@radix-ui/react-hover-card';

type AlertLevel = 'OVERDUE' | 'WARNING' | 'OK';
type MetricType = 'FH' | 'FC' | 'DAYS';

type MetricStatus = {
  type: MetricType;
  remaining: number;
  progress: number;
  level: AlertLevel;
};

type AlertRow = {
  aircraftId: number;
  controlId: number;
  controlTitle: string;
  manualReference: string;
  taskCount: number;
  level: AlertLevel;
  aircraftAcronym: string;
  aircraftSerial: string;
  primaryMetric: MetricStatus;
};

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

const ALL_METRIC_TYPES: MetricType[] = ['FH', 'FC', 'DAYS'];

const METRIC_CONFIG: Record<MetricType, {
  icon: typeof Clock;
  intervalKey: 'interval_fh' | 'interval_fc' | 'interval_days';
}> = {
  FH: { icon: Clock, intervalKey: 'interval_fh' },
  FC: { icon: RefreshCw, intervalKey: 'interval_fc' },
  DAYS: { icon: Calendar, intervalKey: 'interval_days' },
};

function getLevelClass(level: AlertLevel): string {
  if (level === 'OVERDUE') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (level === 'WARNING') return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
  return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400';
}

const LEVEL_CONFIG: Record<AlertLevel, {
  icon: typeof TriangleAlert;
  cardBorder: string;
  cardBg: string;
  iconBg: string;
  iconText: string;
  progressIndicator: string;
}> = {
  OVERDUE: {
    icon: TriangleAlert,
    cardBorder: 'border-l-4 border-l-red-500 border-red-500/20',
    cardBg: 'bg-red-500/5 dark:bg-red-950/20',
    iconBg: 'bg-red-500/10 border border-red-500/20',
    iconText: 'text-red-600 dark:text-red-400',
    progressIndicator: 'bg-red-500',
  },
  WARNING: {
    icon: AlertTriangle,
    cardBorder: 'border-l-4 border-l-amber-500 border-amber-500/20',
    cardBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    iconBg: 'bg-amber-500/10 border border-amber-500/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    progressIndicator: 'bg-amber-500',
  },
  OK: {
    icon: ShieldCheck,
    cardBorder: 'border-l-4 border-l-emerald-500 border-emerald-500/20',
    cardBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    progressIndicator: 'bg-emerald-500',
  },
};

type AlertMetric = {
  type: MetricType;
  remaining: number;
  percentage: number;
  consumed: number;
  status: 'OK' | 'WARNING' | 'OVERDUE';
};

function EstimatedDateCard({ acronym, metrics }: { acronym: string; metrics: AlertMetric[] }) {
  const [requested, setRequested] = useState(false);
  const { data, isLoading } = useGetAircraftAverage(acronym, undefined, requested);

  const handleCalculate = useCallback(() => {
    setRequested(true);
  }, []);

  const estimation = useMemo(() => {
    if (!data?.metrics) return null;

    const { average_daily_flight_hours, average_daily_flight_cycles } = data.metrics;
    let bestEstimate: {
      date: Date;
      baseDate: Date;
      metric: AlertMetric;
      estimatedDays: number;
      dailyAverage?: number;
    } | null = null;

    const baseDate = new Date();

    for (const metric of metrics) {
      if (metric.remaining <= 0) continue;

      let estimatedDays: number | null = null;
      let dailyAverage: number | undefined;

      if (metric.type === 'DAYS') {
        estimatedDays = metric.remaining;
      } else if (metric.type === 'FH' && average_daily_flight_hours > 0) {
        estimatedDays = metric.remaining / average_daily_flight_hours;
        dailyAverage = average_daily_flight_hours;
      } else if (metric.type === 'FC' && average_daily_flight_cycles > 0) {
        estimatedDays = metric.remaining / average_daily_flight_cycles;
        dailyAverage = average_daily_flight_cycles;
      }

      if (estimatedDays === null || !isFinite(estimatedDays)) continue;

      if (!bestEstimate || estimatedDays < bestEstimate.estimatedDays) {
        bestEstimate = {
          date: addDays(baseDate, Math.ceil(estimatedDays)),
          baseDate,
          metric,
          estimatedDays,
          dailyAverage,
        };
      }
    }

    return bestEstimate;
  }, [data, metrics]);

  const explanation = useMemo(() => {
    if (!estimation) return null;

    const remaining = estimation.metric.remaining.toFixed(1);

    if (estimation.metric.type === 'FH' && estimation.dailyAverage) {
      return `Calculado por FH: ${remaining}h restantes / ${estimation.dailyAverage.toFixed(1)}h diarias desde ${format(estimation.baseDate, 'dd MMM yyyy', { locale: es })}`;
    }

    if (estimation.metric.type === 'FC' && estimation.dailyAverage) {
      return `Calculado por FC: ${remaining} ciclos restantes / ${estimation.dailyAverage.toFixed(1)} ciclos diarios desde ${format(estimation.baseDate, 'dd MMM yyyy', { locale: es })}`;
    }

    return `Calculado por calendario: ${remaining} dias restantes desde ${format(estimation.baseDate, 'dd MMM yyyy', { locale: es })}`;
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
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Calculando estimación...</span>
              </div>
              <Skeleton className="h-3 w-44" />
            </div>
          ) : estimation ? (
            <>
              <p className="font-mono text-[11px] font-medium">
                {format(estimation.date, 'dd MMM yyyy', { locale: es })}
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {explanation}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/60">Sin datos</p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function MaintenanceControlsAlertsDashboardPage() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<'all' | number>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertLevel>('all');
  const [query, setQuery] = useState('');

  const { data: aircraft = [], isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);

  const { data: alertsResponse, isLoading: isAlertsLoading } = useQuery({
    ...maintenanceControlsAlertsOptions({
      query: selectedAircraftId === 'all' ? undefined : { aircraft_id: selectedAircraftId },
    }),
    enabled: !!selectedCompany?.slug,
  });

  const alertRows = useMemo(() => alertsResponse?.alerts ?? [], [alertsResponse]);

  const filteredRows = useMemo(() => {
    return alertRows.filter((row) => {
      const matchesSeverity = severityFilter === 'all' || row.status === severityFilter;
      const normalized = query.trim().toLowerCase();
      const matchesSearch =
        normalized.length === 0 ||
        row.control.title.toLowerCase().includes(normalized) ||
        row.control.manual_reference?.toLowerCase().includes(normalized) ||
        row.aircraft.acronym.toLowerCase().includes(normalized) ||
        row.aircraft.serial?.toLowerCase().includes(normalized);

      return matchesSeverity && matchesSearch;
    });
  }, [alertRows, query, severityFilter]);

  const groupedRows = useMemo(() => Object.groupBy(filteredRows, (row) => row.status), [filteredRows]);

  const criticalCount = useMemo(() => groupedRows.OVERDUE?.length ?? 0, [groupedRows]);
  const warningCount = useMemo(() => groupedRows.WARNING?.length ?? 0, [groupedRows]);
  const healthyCount = useMemo(() => groupedRows.OK?.length ?? 0, [groupedRows]);

  const selectedAircraftLabel = useMemo(() => {
    if (selectedAircraftId === 'all') return 'Toda la flota';
    const match = aircraft.find((item) => item.id === selectedAircraftId);
    return match ? `${match.acronym} · ${match.serial}` : 'Aeronave';
  }, [aircraft, selectedAircraftId]);

  if (isAircraftLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Alertas de Controles">
      <main className="max-w-[2080px] space-y-5 p-4 lg:p-6">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground">Dashboard de Alertas</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitoreo operativo de controles de mantenimiento por prioridad y consumo.
              </p>
              <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                {selectedAircraftLabel}
              </Badge>
            </div>

            <Button variant="outline" asChild>
              <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a controles
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                <TriangleAlert className="h-4 w-4" />
                Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Requieren ejecución inmediata</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Entran en ventana de atención</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                En tiempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{healthyCount}</p>
              <p className="text-xs text-muted-foreground">Sin riesgo operacional inmediato</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>Segmenta alertas por aeronave, severidad o referencia.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select
              value={selectedAircraftId === 'all' ? 'all' : String(selectedAircraftId)}
              onValueChange={(value) => setSelectedAircraftId(value === 'all' ? 'all' : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aeronave" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda la flota</SelectItem>
                {aircraft.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.acronym} · {item.serial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as 'all' | AlertLevel)}>
              <SelectTrigger>
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="WARNING">Próximo</SelectItem>
                <SelectItem value="OK">En tiempo</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar control, aeronave o referencia"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {isAlertsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <section key={groupIndex} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, cardIndex) => (
                    <Card key={cardIndex} className="overflow-hidden border-l-4 border-l-muted">
                      <CardHeader className="space-y-2">
                        {/* Title + badge */}
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
                        {/* Aircraft sub-card */}
                        <div className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <div className="flex flex-1 flex-col gap-1">
                            <div className="flex items-baseline justify-between">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-3 w-28" />
                          </div>
                        </div>
                        {/* Last execution */}
                        <div className="flex items-center gap-2 rounded-md border border-border/30 bg-muted/10 px-3 py-1.5">
                          <Skeleton className="h-3 w-3 rounded-sm" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Metrics label */}
                        <Skeleton className="h-3 w-16" />
                        {/* Metrics grid */}
                        <div className="grid auto-cols-fr grid-flow-col gap-2">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="rounded-md border border-border/40 bg-muted/10 px-2 py-1.5 space-y-1.5">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                          ))}
                        </div>
                        {/* Estimated date */}
                        <div className="flex items-center gap-2 rounded-md border border-border/30 bg-muted/10 px-3 py-1.5">
                          <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(['OVERDUE', 'WARNING', 'OK'] as AlertLevel[]).map((status) => {
              const rows = groupedRows[status];

              if (!rows || rows.length === 0) return null;

              return (
                <section key={status} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getLevelClass(status)}>
                      {ALERT_LABELS[status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{rows.length} controles</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((row) => {
                      const { control, aircraft } = row;
                      const controlId = control.id;
                      const aircraftId = aircraft.id;
                      const primaryMetric = row.metrics[0];
                      const cfg = LEVEL_CONFIG[row.status];
                      const LevelIcon = cfg.icon;
                      return (
                        <Card
                          key={`${status}-${controlId}-${aircraftId}`}
                          className={`group overflow-hidden transition hover:-translate-y-0.5 ${cfg.cardBorder} ${cfg.cardBg}`}
                        >
                          <CardHeader className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${cfg.iconBg}`}>
                                  <LevelIcon className={`h-3.5 w-3.5 ${cfg.iconText}`} />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-foreground">{control.title}</p>
                                  <p className="font-mono text-xs text-muted-foreground">{control.manual_reference}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={getLevelClass(row.status)}>
                                {ALERT_LABELS[row.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 rounded-md border border-sky-200/60 bg-sky-50/50 px-3 py-2 dark:border-sky-800/40 dark:bg-sky-950/20">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-sky-200 bg-sky-100/80 dark:border-sky-800/60 dark:bg-sky-900/40">
                                <Plane className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                              </div>
                              <div className="flex flex-1 flex-col gap-0.5">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-mono text-sm font-bold tracking-wide text-sky-700 dark:text-sky-300">
                                    {aircraft.acronym}
                                  </span>
                                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                    S/N {aircraft.serial}
                                  </span>
                                </div>
                                {aircraft.aircraft_type && (
                                  <span className="text-[11px] text-muted-foreground">{aircraft.aircraft_type.full_name}</span>
                                )}
                              </div>
                            </div>
                            {row.last_execution && (
                              <HoverCard openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <div className="flex cursor-default items-center gap-2 rounded-md border border-border/40 bg-muted/15 px-3 py-1.5">
                                    <Wrench className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[11px] text-muted-foreground">Última ejecución:</span>
                                    <span className="font-mono text-[11px] font-medium">
                                      {format(new Date(row.last_execution.executed_at), "dd MMM yyyy", { locale: es })}
                                    </span>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardPortal>
                                  <HoverCardContent align="center" className="w-72 space-y-3 text-sm">
                                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                      <FileText className="h-3 w-3" />
                                      Detalle de ejecución
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ejecutado</p>
                                        <p className="font-mono text-xs font-medium">
                                          {format(new Date(row.last_execution.executed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                        </p>
                                      </div>
                                      {row.last_execution.completed_at && (
                                        <div>
                                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Completado</p>
                                          <p className="font-mono text-xs font-medium">
                                            {format(new Date(row.last_execution.completed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">FH al momento</p>
                                        <p className="font-mono text-xs font-medium tabular-nums">{row.last_execution.current_fh}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">FC al momento</p>
                                        <p className="font-mono text-xs font-medium tabular-nums">{row.last_execution.current_fc}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Estado</p>
                                        <p className="text-xs font-medium">{row.last_execution.status}</p>
                                      </div>
                                      {row.last_execution.notes && (
                                        <div className="col-span-2">
                                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Notas</p>
                                          <p className="text-xs text-foreground/80">{row.last_execution.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </HoverCardContent>

                                </HoverCardPortal>
                              </HoverCard>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                              <Gauge className="h-3 w-3" />
                              Métricas
                            </p>
                            <div className="grid auto-cols-fr grid-flow-col gap-2">
                              {ALL_METRIC_TYPES.filter((type) => {
                                const interval = control[METRIC_CONFIG[type].intervalKey];
                                return interval !== null && interval !== undefined;
                              }).map((type) => {
                                const metric = row.metrics.find((m) => m.type === type);
                                const interval = control[METRIC_CONFIG[type].intervalKey];
                                const metricCfg = metric ? LEVEL_CONFIG[metric.status] : null;
                                const MetricIcon = METRIC_CONFIG[type].icon;

                                return (
                                  <div
                                    key={type}
                                    className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5"
                                  >
                                    <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                      <MetricIcon className="h-3 w-3" />
                                      {METRIC_LABELS[type]}
                                    </p>
                                    {metric ? (
                                      <>
                                        <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
                                          <span className={metricCfg?.iconText}>{metric.consumed.toFixed(1)}</span>
                                          <span className="text-muted-foreground">/{interval}</span>
                                          <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                                            {METRIC_UNITS[type]}
                                          </span>
                                        </p>
                                        <Progress
                                          value={metric.percentage}
                                          className="mt-1.5 h-1.5"
                                          indicatorClassName={metricCfg?.progressIndicator}
                                        />
                                      </>
                                    ) : (
                                      <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums">
                                        <span>0</span>
                                        <span className="text-muted-foreground">/{interval}</span>
                                        <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                                          {METRIC_UNITS[type]}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <EstimatedDateCard acronym={aircraft.acronym} metrics={row.metrics} />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </ContentLayout >
  );
}
