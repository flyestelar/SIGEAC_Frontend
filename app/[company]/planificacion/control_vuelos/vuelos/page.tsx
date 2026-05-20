'use client';

import { CreateFlightControlDialog } from '@/components/dialogs/aerolinea/administracion/CreateFlightControl';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetFlightControl } from '@/hooks/planificacion/useGetFlightsControl';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetAverageCyclesAndHours } from '@/hooks/planificacion/vuelos/useGetAverageCyclesAndHours';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AlertTriangle, BarChart3, Clock, Info, Loader2, Plane, Repeat2, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getColumns } from './columns';
import { DataTable } from './data-table';
import { AircraftSelector } from '@/app/[company]/planificacion/control_mantenimiento/_components/aircraft-selector';

const FlightControlPage = () => {
  const { selectedCompany } = useCompanyStore();
  const companySlug = selectedCompany?.slug ?? '';
  const { data: flights, isLoading, isError } = useGetFlightControl(companySlug);
  const { data: aircrafts, isLoading: isAircraftsLoading } = useGetMaintenanceAircrafts(companySlug);

  const [activeAircraftId, setActiveAircraftId] = useState<string>('');

  const activeAircraftAcronym = useMemo(() => {
    const selected = aircrafts?.find((a) => String(a.id) === activeAircraftId);
    return selected?.acronym ?? '';
  }, [aircrafts, activeAircraftId]);

  if (!activeAircraftId && aircrafts?.length) {
    setActiveAircraftId(String(aircrafts[0].id));
  }

  const {
    data: averageStats,
    isLoading: isLoadingAverageStats,
    isError: isErrorAverageStats,
  } = useGetAverageCyclesAndHours(activeAircraftAcronym);

  const columns = useMemo(() => getColumns(companySlug), [companySlug]);

  const activeFlights = useMemo(() => {
    if (!flights?.length || !activeAircraftId) return [];
    const id = Number(activeAircraftId);
    return flights.filter((f) => f.aircraft?.id === id);
  }, [flights, activeAircraftId]);

  const stats = useMemo(() => {
    const totalHours = activeFlights.reduce((acc, f) => acc + Number(f.flight_hours ?? 0), 0);
    const totalCycles = activeFlights.reduce((acc, f) => acc + Number(f.flight_cycles ?? 0), 0);
    return {
      count: activeFlights.length,
      totalHours,
      totalCycles,
    };
  }, [activeFlights]);

  if (isLoading || isAircraftsLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Control de vuelos">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header Block with quick actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-border/60">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Plane className="h-8 w-8 text-sky-500" />
              Control de Horas de Vuelo
            </h1>
            <p className="text-sm text-foreground/80">
              Registro por aeronave con desglose de horas y ciclos operacionales.
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <CreateFlightControlDialog defaultAircraftId={activeAircraftId} />
          </div>
        </div>

        <AircraftSelector
          aircraft={aircrafts ?? []}
          selectedAircraftId={activeAircraftId ? Number(activeAircraftId) : null}
          onSelectAircraft={(id) => setActiveAircraftId(String(id))}
        />

        {isError && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de Conexión</AlertTitle>
            <AlertDescription>Ha ocurrido un problema al cargar el control de vuelos.</AlertDescription>
          </Alert>
        )}

        {!!aircrafts?.length && flights && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: List and Tabs */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="rounded-lg border bg-background shadow-none">
                <CardHeader className="p-4 border-b border-border/60">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold">Historial de Operaciones</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Visualización de cargas registradas para la aeronave.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {activeFlights.length ? (
                    <DataTable columns={columns} data={activeFlights} />
                  ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 p-8 text-center bg-muted/10">
                      <Plane className="h-8 w-8 text-muted-foreground/60 animate-pulse" />
                      <p className="text-sm font-medium text-foreground">Sin vuelos registrados</p>
                      <p className="text-xs text-muted-foreground max-w-[280px]">
                        Cuando se registren vuelos para la aeronave {activeAircraftAcronym || 'seleccionada'}, aparecerán en este panel.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Key Technical Metrics (Sticky panel) */}
            <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
              {/* Totales Section */}
              <Card className="rounded-lg border bg-background shadow-none">
                <CardHeader className="p-4 border-b border-border/60">
                  <div className="flex items-center gap-2 text-primary">
                    <BarChart3 className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Métricas Totales
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border/50 rounded-lg p-3 bg-muted/5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                        Total Horas
                      </span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-sky-500" />
                        <span className="text-lg font-bold font-mono text-foreground">
                          {stats.totalHours.toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="border border-border/50 rounded-lg p-3 bg-muted/5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                        Total Ciclos
                      </span>
                      <div className="flex items-center gap-2">
                        <Repeat2 className="h-4 w-4 text-indigo-500" />
                        <span className="text-lg font-bold font-mono text-foreground">
                          {stats.totalCycles.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border/50 rounded-lg p-3 bg-muted/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block">
                        Vuelos Registrados
                      </span>
                      <span className="text-base font-bold font-mono text-foreground">{stats.count} vuelos</span>
                    </div>
                    <div className="p-1 px-2.5 text-[10px] font-bold rounded bg-sky-500/10 text-sky-600 border border-sky-500/20 uppercase tracking-widest font-mono">
                      Acumulativos
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Promedios Section */}
              <Card className="rounded-lg border bg-background shadow-none">
                <CardHeader className="p-4 border-b border-border/60">
                  <div className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
                      Estadísticas Promedio
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {isLoadingAverageStats ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">Calculando promedios...</span>
                    </div>
                  ) : isErrorAverageStats ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
                      <p className="text-xs text-red-600 font-medium">Error al cargar estadísticas</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3.5">
                        {/* Daily Average Hours */}
                        <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            Horas / Día
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            {Number(averageStats?.metrics?.average_daily_flight_cycles ?? 0).toFixed(2)} h
                          </span>
                        </div>

                        {/* Daily Average Cycles */}
                        <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Repeat2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Ciclos / Día
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            {Number(averageStats?.metrics?.average_daily_flight_cycles ?? 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Flights per period */}
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                            Vuelos Totales
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            {averageStats?.metrics?.flights_count ?? 0}
                          </span>
                        </div>
                      </div>

                      <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3 text-amber-900 dark:text-amber-300 text-xs flex gap-2">
                        <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="leading-normal">
                          Los promedios diarios corresponden al historial de actividad e indican la tasa de utilización
                          estimada.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default FlightControlPage;
