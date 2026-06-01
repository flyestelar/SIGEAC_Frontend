'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlanificationAlert,
  PlanificationAlertItemType,
  PlanificationAlertMetric,
  PlanificationAlertStatus,
  PlanificationAlertsSummary,
  useGetPlanificationAlerts,
} from '@/hooks/planificacion/useGetPlanificationAlerts';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Gauge,
  Plane,
  Search,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { AlertBadge } from '../control_mantenimiento/_components/control-grid-shared';

const LEVEL_CONFIG: Record<
  PlanificationAlertStatus,
  {
    icon: typeof TriangleAlert;
    cardBorder: string;
    cardBg: string;
    iconText: string;
    label: string;
    helpText: string;
  }
> = {
  OVERDUE: {
    icon: TriangleAlert,
    cardBorder: 'border-red-500/20',
    cardBg: 'bg-red-500/5 dark:bg-red-950/20',
    iconText: 'text-red-600 dark:text-red-400',
    label: 'Vencidos',
    helpText: 'Requieren atención inmediata',
  },
  WARNING: {
    icon: AlertTriangle,
    cardBorder: 'border-amber-500/20',
    cardBg: 'bg-amber-500/5 dark:bg-amber-950/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    label: 'Próximos',
    helpText: 'Entraron en ventana de atención',
  },
  OK: {
    icon: ShieldCheck,
    cardBorder: 'border-emerald-500/20',
    cardBg: 'bg-emerald-500/5 dark:bg-emerald-950/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    label: 'En tiempo',
    helpText: 'Sin riesgo inmediato',
  },
};

const ITEM_TYPE_CONFIG: Record<
  PlanificationAlertItemType,
  {
    label: string;
    className: string;
    icon: typeof Wrench;
  }
> = {
  maintenance_control: {
    label: 'Control',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    icon: Wrench,
  },
  hard_time: {
    label: 'Hard Time',
    className: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    icon: Gauge,
  },
  directive: {
    label: 'Directiva',
    className: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    icon: FileText,
  },
};

const GOVERNING_METRIC_CONFIG: Record<
  PlanificationAlertMetric,
  {
    label: string;
    icon: typeof Calendar;
  }
> = {
  CALENDAR: { label: 'Calendario', icon: Calendar },
  FH: { label: 'Flight Hours', icon: Clock },
  FC: { label: 'Flight Cycles', icon: Gauge },
};

const EMPTY_SUMMARY: PlanificationAlertsSummary = {
  OK: 0,
  WARNING: 0,
  OVERDUE: 0,
  total: 0,
};

function formatAlertDate(value: string | null) {
  if (!value) return 'Sin proyección';

  return format(new Date(`${value}T00:00:00`), 'dd MMM yyyy', { locale: es });
}

function formatRemainingValue(alert: PlanificationAlert) {
  if (alert.remaining_value === null || alert.remaining_unit === null) {
    return 'N/A';
  }

  if (alert.remaining_unit === 'days') {
    return `${alert.remaining_value} días`;
  }

  const suffix = alert.remaining_unit === 'flight_hours' ? 'FH' : 'FC';
  return `${alert.remaining_value.toFixed(2)} ${suffix}`;
}

function SummaryCard({ status, value }: { status: PlanificationAlertStatus; value: number }) {
  const config = LEVEL_CONFIG[status];
  const Icon = config.icon;

  return (
    <Card className={`${config.cardBorder} ${config.cardBg}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center gap-2 text-sm ${config.iconText}`}>
          <Icon className="h-4 w-4" />
          {config.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{config.helpText}</p>
      </CardContent>
    </Card>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-80" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-border/60 p-3 md:grid-cols-8">
            {Array.from({ length: 8 }).map((__, cellIndex) => (
              <Skeleton key={cellIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AlertQueueTable({ alerts }: { alerts: PlanificationAlert[] }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Aeronave
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Identificador
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Métrica determinante
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Fecha determinante
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Restante
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Fecha proyectada
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => {
            const itemType = ITEM_TYPE_CONFIG[alert.item_type];
            const metric = GOVERNING_METRIC_CONFIG[alert.governing_metric];
            const MetricIcon = metric.icon;
            const ItemTypeIcon = itemType.icon;

            return (
              <tr
                key={`${alert.item_type}-${alert.item_identifier}-${alert.aircraft.id}`}
                className="border-b border-border/50"
              >
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <AlertBadge status={alert.status} size="small" />
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <Badge variant="outline" className={`gap-1 ${itemType.className}`}>
                    <ItemTypeIcon className="h-3 w-3" />
                    {itemType.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
                      <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                      {alert.aircraft.acronym ?? 'Sin sigla'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alert.aircraft.model ?? 'Modelo no disponible'}
                      {alert.aircraft.serial ? ` · S/N ${alert.aircraft.serial}` : ''}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap font-mono text-xs font-semibold text-foreground">
                  {alert.item_identifier}
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="max-w-sm text-sm text-foreground">{alert.description || 'Sin descripción'}</p>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-2 py-1 text-xs font-medium text-foreground">
                    <MetricIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {metric.label}
                  </div>
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-foreground whitespace-nowrap">
                  {formatAlertDate(alert.governing_date)}
                </td>
                <td className="px-4 py-3 align-top font-mono text-xs text-foreground whitespace-nowrap">{formatRemainingValue(alert)}</td>
                <td className="px-4 py-3 align-top font-mono text-xs text-foreground whitespace-nowrap">
                  {alert.projected_date ? formatAlertDate(alert.projected_date) : 'Sin proyección'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PlanificationAlertsDashboardPage() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<'all' | number>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PlanificationAlertStatus>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | PlanificationAlertItemType>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const { data: aircraft = [], isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);

  const {
    data: alertsResponse,
    isLoading: isAlertsLoading,
    isError,
    error,
  } = useGetPlanificationAlerts(
    {
      aircraft_id: selectedAircraftId === 'all' ? undefined : selectedAircraftId,
      item_type: itemTypeFilter === 'all' ? undefined : itemTypeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    !!selectedCompany?.slug,
  );

  const alertRows = useMemo(() => alertsResponse?.alerts ?? [], [alertsResponse]);
  const summary = alertsResponse?.summary ?? EMPTY_SUMMARY;

  const filteredRows = useMemo(() => {
    return alertRows.filter((row) => {
      const matchesSearch =
        deferredQuery.length === 0 ||
        row.item_identifier.toLowerCase().includes(deferredQuery) ||
        row.description?.toLowerCase().includes(deferredQuery) ||
        row.aircraft.acronym?.toLowerCase().includes(deferredQuery) ||
        row.aircraft.serial?.toLowerCase().includes(deferredQuery);

      return matchesSearch;
    });
  }, [alertRows, deferredQuery]);

  const selectedAircraftLabel = useMemo(() => {
    if (selectedAircraftId === 'all') return 'Toda la flota';
    const match = aircraft.find((item) => item.id === selectedAircraftId);
    return match ? `${match.acronym} · ${match.serial}` : 'Aeronave';
  }, [aircraft, selectedAircraftId]);

  if (isAircraftLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Alertas de Vencimiento">
      <main className="max-w-[2080px] space-y-5 p-4 lg:p-6">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground">Cola unificada de vencimientos</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Monitoreo operativo de controles, hard time y directivas en el orden priorizado por backend.
              </p>
              <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                {selectedAircraftLabel}
              </Badge>
            </div>

            <Button variant="outline" asChild>
              <Link href={`/${selectedCompany?.slug}/planificacion`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a planificación
              </Link>
            </Button>
          </div>
        </div>

        {isAlertsLoading ? (
          <SummarySkeleton />
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard status="OVERDUE" value={summary.OVERDUE} />
            <SummaryCard status="WARNING" value={summary.WARNING} />
            <SummaryCard status="OK" value={summary.OK} />
            <Card className="border-border/60 bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{summary.total}</p>
                <p className="text-xs text-muted-foreground">Items en la cola actual</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>
              Consulta backend por aeronave, tipo de ítem y severidad. La búsqueda de texto es local.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
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

            <Select
              value={itemTypeFilter}
              onValueChange={(value) => setItemTypeFilter(value as 'all' | PlanificationAlertItemType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de ítem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="maintenance_control">Control de mantenimiento</SelectItem>
                <SelectItem value="hard_time">Hard time</SelectItem>
                <SelectItem value="directive">Directiva</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | PlanificationAlertStatus)}
            >
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
                placeholder="Buscar identificador, descripción o aeronave"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {isAlertsLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No se pudieron cargar las alertas</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Ocurrió un error inesperado al consultar la cola unificada.'}
            </AlertDescription>
          </Alert>
        ) : filteredRows.length === 0 ? (
          <Card className="border-dashed border-border/70">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Siren className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">No hay alertas para los filtros actuales.</p>
              <p className="max-w-lg text-sm text-muted-foreground">
                {alertRows.length === 0
                  ? 'Backend no devolvió ítems para la combinación seleccionada. El resumen superior se mantiene visible.'
                  : 'La cola sí contiene ítems, pero ninguno coincide con la búsqueda de texto actual.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Cola priorizada</CardTitle>
                  <CardDescription>
                    Se respeta el orden entregado por backend: severidad, fecha, restante, aeronave e identificador.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {filteredRows.length} / {summary.total}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AlertQueueTable alerts={filteredRows} />
            </CardContent>
          </Card>
        )}
      </main>
    </ContentLayout>
  );
}
