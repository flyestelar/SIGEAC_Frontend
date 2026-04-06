'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompanyStore } from '@/stores/CompanyStore';
import {
  aircraftIndexOptions,
  maintenanceControlExecutionsStoreMutation,
  maintenanceControlsIndexOptions,
  maintenanceControlsIndexQueryKey,
  maintenanceControlsShowQueryKey,
} from '@api/queries';
import { AircraftResource, StoreMaintenanceControlExecutionRequest } from '@api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { AlertCircle, CheckCircle2, GaugeCircle, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';

const formatConsumed = (consumed: number | null, unit: string) => {
  if (consumed === null) return 'N/A';
  return `${consumed.toFixed(1)} ${unit}`;
};

const getConsumedColor = (consumed: number | null, interval: number | null) => {
  if (consumed === null || interval === null || interval === 0) return 'text-muted-foreground';
  const percentage = (consumed / interval) * 100;
  if (percentage >= 90) return 'text-red-600 font-semibold';
  if (percentage >= 70) return 'text-orange-600 font-semibold';
  if (percentage >= 50) return 'text-yellow-600 font-semibold';
  return 'text-green-600';
};

const getStatus = (consumed: number | null, interval: number | null) => {
  if (consumed === null || interval === null) return { label: 'Sin intervalo', variant: 'outline' as const };
  if (consumed >= interval) return { label: 'Vencido', variant: 'destructive' as const };
  if (consumed >= interval * 0.9) return { label: 'Próximo', variant: 'secondary' as const };
  return { label: 'En tiempo', variant: 'default' as const };
};

export default function MaintenanceControlTestPage() {
  const company = useCompanyStore((state) => state.selectedCompany?.slug!);
  const { data: aircrafts = [], isLoading: isAircraftsLoading } = useQuery({
    ...aircraftIndexOptions({
      path: { company },
    }),
    select: (data) => data as AircraftResource[],
  });
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const { data, isLoading, isError } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: { aircraft_id: selectedAircraftId! },
    }),
    enabled: !!selectedAircraftId,
  });
  const controls = useMemo(() => data?.data ?? [], [data]);

  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);
  const [customConsumedFH, setCustomConsumedFH] = useState<string>('');
  const [customConsumedFC, setCustomConsumedFC] = useState<string>('');
  const [customConsumedDays, setCustomConsumedDays] = useState<string>('');

  // Seleccionar automáticamente el primer control cuando se carguen
  useEffect(() => {
    if (controls.length > 0 && selectedControlId === null) {
      setSelectedControlId(controls[0].id);
    }
  }, [controls, selectedControlId]);

  const queryClient = useQueryClient();

  const createControlExecutionMutation = useMutation({
    ...maintenanceControlExecutionsStoreMutation(),
    onSuccess: () => {
      toast.success('Ejecución de control creada');
      queryClient.invalidateQueries({ queryKey: maintenanceControlsIndexQueryKey() });
      queryClient.invalidateQueries({
        queryKey: maintenanceControlsShowQueryKey({ path: { id: Number(selectedControlId) } }),
      });
    },
    onError: () => {
      toast.error('No se pudo crear la ejecución del control');
    },
  });

  const selectedControl = selectedControlId
    ? (data?.data.find((control) => control.id === selectedControlId) ?? null)
    : null;

  const tasks = selectedControl?.task_cards || [];

  // Obtener la aeronave seleccionada
  const selectedAircraft = aircrafts.find((aircraft) => aircraft.id === selectedAircraftId);

  // Calcular consumo basado en la aeronave seleccionada
  const consumedValues = useMemo(() => {
    if (!selectedAircraft) {
      return { fh: 0, fc: 0, days: 0 };
    }

    // Calcular días desde la fecha de fabricación usando date-fns
    const fabricantDate = new Date(selectedAircraft.fabricant_date);
    const today = new Date();
    const daysDiff = differenceInDays(today, fabricantDate);

    return {
      fh: customConsumedFH ? Number(customConsumedFH) : selectedAircraft.flight_hours,
      fc: customConsumedFC ? Number(customConsumedFC) : selectedAircraft.flight_cycles,
      days: customConsumedDays ? Number(customConsumedDays) : daysDiff,
    };
  }, [selectedAircraft, customConsumedFH, customConsumedFC, customConsumedDays]);

  const handleResetCustomValues = () => {
    setCustomConsumedFH('');
    setCustomConsumedFC('');
    setCustomConsumedDays('');
  };

  const handleCreateTaskExecution = (taskId: number, taskCode: string) => {
    if (!selectedAircraftId) {
      toast.error('Debe seleccionar una aeronave');
      return;
    }

    if (!selectedControlId) {
      toast.error('Debe seleccionar un control de mantenimiento');
      return;
    }
  };

  const handleCreateControlExecution = () => {
    if (!selectedAircraftId) {
      toast.error('Debe seleccionar una aeronave');
      return;
    }

    if (!selectedControlId) {
      toast.error('Debe seleccionar un control de mantenimiento');
      return;
    }

    const executionData: StoreMaintenanceControlExecutionRequest = {
      maintenance_control_id: selectedControlId,
      aircraft_id: selectedAircraftId,
      executed_at: new Date().toISOString(),
      status: 'COMPLETED',
    };

    createControlExecutionMutation.mutate({
      body: executionData,
    });
  };

  const rows = useMemo(() => {
    if (!selectedControl || !tasks.length) return [];

    // Usar los intervalos del control para todas las tareas
    const controlIntervalFH = selectedControl.interval_fh;
    const controlIntervalFC = selectedControl.interval_fc;
    const controlIntervalDays = selectedControl.interval_days;

    return tasks.map((task) => {
      // Calcular consumed basado en consumo actual - última ejecución
      const lastFH = selectedControl.last_execution?.current_fh || 0;
      const lastFC = selectedControl.last_execution?.current_fc || 0;
      const lastExecutedAt = selectedControl.last_execution?.executed_at
        ? new Date(selectedControl.last_execution.executed_at)
        : null;

      // Calcular días desde la última ejecución usando date-fns
      const lastDays = lastExecutedAt ? differenceInDays(new Date(), lastExecutedAt) : 0; // Si nunca se ejecutó, usar 0

      const consumedFH = consumedValues.fh - lastFH;
      const consumedFC = consumedValues.fc - lastFC;
      const consumedDays = consumedValues.days - lastDays;

      const statuses = [
        getStatus(consumedFH, controlIntervalFH),
        getStatus(consumedFC, controlIntervalFC),
        getStatus(consumedDays, controlIntervalDays),
      ];

      const priorityStatus =
        statuses.find((status) => status.label === 'Vencido') ??
        statuses.find((status) => status.label === 'Próximo') ??
        statuses.find((status) => status.label === 'En tiempo') ??
        statuses[0];

      return {
        intervalFH: controlIntervalFH,
        intervalFC: controlIntervalFC,
        intervalDays: controlIntervalDays,
        consumedFH,
        consumedFC,
        consumedDays,
        status: priorityStatus,
        lastExecution: selectedControl.last_execution,
        ...task,
      };
    });
  }, [consumedValues.days, consumedValues.fc, consumedValues.fh, selectedControl, tasks]);

  if (isAircraftsLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Prueba de Consumo de Mantenimiento">
      <div className="space-y-5 p-4 lg:p-6 max-w-[1600px]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GaugeCircle className="h-5 w-5 text-primary" />
              Página de Prueba de Consumo
            </CardTitle>
            <CardDescription>
              Selecciona una aeronave y un control de mantenimiento para ver cuánto se ha consumido desde la última
              ejecución de cada tarea. Puedes personalizar temporalmente los valores de consumo para simular diferentes
              escenarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Aeronave</p>
              <Select
                value={selectedAircraftId ? String(selectedAircraftId) : ''}
                onValueChange={(value) => {
                  setSelectedAircraftId(Number(value));
                  setSelectedControlId(null); // Limpiar selección de control al cambiar aeronave
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una aeronave" />
                </SelectTrigger>
                <SelectContent>
                  {aircrafts.map((aircraft) => (
                    <SelectItem key={aircraft.id} value={String(aircraft.id)}>
                      {aircraft.serial} - {aircraft.acronym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Control de mantenimiento</p>
              <Select
                value={selectedControlId ? String(selectedControlId) : ''}
                onValueChange={(value) => {
                  setSelectedControlId(Number(value));
                  // Limpiar valores personalizados al cambiar de control
                  setCustomConsumedFH('');
                  setCustomConsumedFC('');
                  setCustomConsumedDays('');
                }}
                disabled={!selectedAircraftId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedAircraftId ? 'Selecciona un control' : 'Primero selecciona una aeronave'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {controls.map((control) => (
                    <SelectItem key={control.id} value={String(control.id)}>
                      {control.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedAircraft && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Consumo de la aeronave</span>
                <Button variant="outline" size="sm" onClick={handleResetCustomValues} className="text-xs">
                  Resetear
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedAircraft.serial} - {selectedAircraft.acronym}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{consumedValues.fh.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Horas de vuelo (FH)</p>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={1}
                    fixedDecimalScale
                    allowNegative={false}
                    placeholder={selectedAircraft.flight_hours.toString()}
                    value={customConsumedFH}
                    onValueChange={(values) => setCustomConsumedFH(values.value)}
                    className="mt-2 text-xs"
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{consumedValues.fc}</p>
                  <p className="text-xs text-muted-foreground">Ciclos de vuelo (FC)</p>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    placeholder={selectedAircraft.flight_cycles.toString()}
                    value={customConsumedFC}
                    onValueChange={(values) => setCustomConsumedFC(values.value)}
                    className="mt-2 text-xs"
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{consumedValues.days}</p>
                  <p className="text-xs text-muted-foreground">Días desde fabricación</p>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    placeholder={differenceInDays(new Date(), new Date(selectedAircraft.fabricant_date)).toString()}
                    value={customConsumedDays}
                    onValueChange={(values) => setCustomConsumedDays(values.value)}
                    className="mt-2 text-xs"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Personaliza los valores arriba para simular diferentes escenarios de mantenimiento
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedControl && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Última ejecución del control
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateControlExecution}
                  disabled={createControlExecutionMutation.isPending}
                  className="text-xs"
                >
                  {createControlExecutionMutation.isPending ? 'Creando...' : 'Ejecutar Control'}
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedControl.last_execution
                  ? 'Información de la última vez que se ejecutó este control de mantenimiento'
                  : 'Este control aún no ha sido ejecutado. Haz clic en "Ejecutar Control" para registrarlo.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedControl.last_execution ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary">
                        {selectedControl.last_execution.current_fh.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Horas de vuelo (FH)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary">{selectedControl.last_execution.current_fc}</p>
                      <p className="text-xs text-muted-foreground">Ciclos de vuelo (FC)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary">
                        {new Date(selectedControl.last_execution.executed_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Fecha de ejecución</p>
                    </div>
                  </div>
                  {selectedControl.since_last && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3 text-center">Consumo desde la última ejecución</h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600">
                            {selectedControl.since_last.fh.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">Horas de vuelo consumidas</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            / {selectedControl.interval_fh?.toFixed(1) || 'N/A'} requerido
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600">{selectedControl.since_last.fc}</p>
                          <p className="text-xs text-muted-foreground">Ciclos de vuelo consumidos</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            / {selectedControl.interval_fc || 'N/A'} requerido
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-blue-600">{selectedControl.since_last.days}</p>
                          <p className="text-xs text-muted-foreground">Días transcurridos</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            / {selectedControl.interval_days || 'N/A'} requerido
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="text-center pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Estado del consumo actual basado en esta última ejecución
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No hay ejecuciones registradas para este control</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isError && selectedAircraftId && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                No se pudo cargar los controles de mantenimiento para esta aeronave.
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedAircraftId ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Selecciona una aeronave para ver sus controles de mantenimiento.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Cargando controles de mantenimiento...</p>
            </CardContent>
          </Card>
        ) : controls.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                No hay controles de mantenimiento asignados para esta aeronave.
              </p>
            </CardContent>
          </Card>
        ) : !selectedControlId ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Selecciona un control de mantenimiento para ver sus tareas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tareas del control</CardTitle>
              <CardDescription>
                Consumo desde la última ejecución para:{' '}
                <span className="font-medium text-foreground">{selectedControl?.title}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs text-primary">
                        <div>{row.new_task}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{row.old_task}</div>
                      </TableCell>
                      <TableCell className="max-w-[300px] text-xs">{row.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ContentLayout>
  );
}
