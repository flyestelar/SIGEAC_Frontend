'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { maintenanceControlsAlertsOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Search, ShieldCheck, Siren, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

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
  FH: 'Horas de vuelo',
  FC: 'Ciclos de vuelo',
  DAYS: 'Calendario',
};

function getLevelClass(level: AlertLevel): string {
  if (level === 'OVERDUE') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (level === 'WARNING') return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
  return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400';
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
            {Array.from({ length: 3 }).map((_, groupIndex) => (
              <section key={groupIndex} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, cardIndex) => (
                    <Card key={cardIndex} className="border-border/60">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                          <div>
                            <Skeleton className="h-3 w-12 mb-1" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <div className="text-right">
                            <Skeleton className="h-3 w-8 mb-1" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Skeleton className="h-3 w-24 mb-1" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-8" />
                          </div>
                          <Skeleton className="h-2 w-full" />
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
                      return (
                        <Card
                          key={`${status}-${controlId}-${aircraftId}`}
                          className="group border-border/60 bg-muted/20 transition hover:-translate-y-0.5 hover:bg-muted/30"
                        >
                          <CardHeader className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">{control.title}</p>
                                <p className="text-xs text-muted-foreground">{control.manual_reference}</p>
                              </div>
                              <Badge variant="outline" className={getLevelClass(row.status)}>
                                {ALERT_LABELS[row.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Aeronave</p>
                                <p className="text-sm font-medium">{aircraft.acronym}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Serie</p>
                                <p className="text-sm font-medium">S/N {aircraft.serial}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Métrica prioritaria</p>
                              <p className="text-sm">
                                {METRIC_LABELS[primaryMetric.type]} · {Math.max(primaryMetric.remaining, 0).toFixed(1)}{' '}
                                restantes
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Cobertura</span>
                                <span className="font-mono tabular-nums">{primaryMetric.percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={primaryMetric.percentage} className="h-2" />
                            </div>
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
    </ContentLayout>
  );
}
