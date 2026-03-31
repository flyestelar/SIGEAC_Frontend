'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  maintenanceControlsIndexOptions,
  maintenanceControlsIndexQueryKey,
  maintenanceControlsShowOptions,
  maintenanceControlsShowQueryKey,
} from '@api/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { AlertCircle, CheckCircle2, GaugeCircle, Wrench } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
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
  const { data, isLoading, isError } = useQuery({
    ...maintenanceControlsIndexOptions(),
  });
  const controls = useMemo(() => data?.data ?? [], [data]);

  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
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
  const createTaskExecutionMutation = useMutation({
    ...taskExecutionsStoreMutation(),
    onSuccess: () => {
      toast.success('Ejecución de tarea creada');
      queryClient.invalidateQueries({ queryKey: maintenanceControlsIndexQueryKey() });
      queryClient.invalidateQueries({
        queryKey: maintenanceControlsShowQueryKey({ path: { id: Number(selectedControlId) } }),
      });
      queryClient.invalidateQueries({
        queryKey: maintenanceControlsGetTasksQueryKey({ path: { id: Number(selectedControlId) } }),
      });
    },
  });

  const controlQuery = useQuery({
    ...maintenanceControlsShowOptions({ path: { id: Number(selectedControlId) } }),
    enabled: !!selectedControlId,
  });

  const tasksQuery = useQuery({
    ...maintenanceControlsGetTasksOptions({
      path: { id: Number(selectedControlId) },
      query: selectedAircraftId ? { aircraft_id: Number(selectedAircraftId) } : undefined,
    }),
    enabled: !!selectedControlId,
  });

  const selectedControl = selectedControlId
    ? (data?.data.find((control) => control.id === selectedControlId) ?? null)
    : null;

  // Seleccionar automáticamente la primera aeronave cuando se seleccione un control
  useEffect(() => {
    if (selectedControl?.aircrafts && selectedControl.aircrafts.length > 0 && selectedAircraftId === null) {
      setSelectedAircraftId(selectedControl.aircrafts[0].id);
    }
  }, [selectedControl, selectedAircraftId]);

  const tasks = tasksQuery.data?.data || [];

  // Obtener la aeronave seleccionada
  const selectedAircraft = selectedControl?.aircrafts?.find((aircraft) => aircraft.id === selectedAircraftId);

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

    if (tasksQuery.isLoading) {
      toast.error('Espere a que se carguen las tareas');
      return;
    }

    const executionData: StoreTaskExecutionRequest = {
      task_card_id: Number(taskId),
      maintenance_control_id: Number(selectedControlId),
      aircraft_id: Number(selectedAircraftId),
    };

    createTaskExecutionMutation.mutate({ body: executionData });
  };

  const rows = useMemo(() => {
    if (!selectedControl || !tasks.length) return [];

    // Usar los intervalos del control para todas las tareas
    const controlIntervalFH = selectedControl.interval_fh;
    const controlIntervalFC = selectedControl.interval_fc;
    const controlIntervalDays = selectedControl.interval_days;

    return tasks.map((task) => {
      // Calcular consumed basado en consumo actual - última ejecución
      const lastFH = task.last_execution?.current_fh || 0;
      const lastFC = task.last_execution?.current_fc || 0;
      const lastExecutedAt = task.last_execution?.executed_at ? new Date(task.last_execution.executed_at) : null;

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
        id: task.id,
        code: task.new_task || task.old_task || `TASK-${task.id}`,
        description: task.description,
        intervalFH: controlIntervalFH,
        intervalFC: controlIntervalFC,
        intervalDays: controlIntervalDays,
        consumedFH,
        consumedFC,
        consumedDays,
        status: priorityStatus,
        lastExecution: task.last_execution,
      };
    });
  }, [consumedValues.days, consumedValues.fc, consumedValues.fh, selectedControl, tasks]);

  if (isLoading) return <LoadingPage />;

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
              Selecciona un control de mantenimiento y una aeronave para ver cuánto se ha consumido desde la última
              ejecución de cada tarea. Puedes personalizar temporalmente los valores de consumo para simular diferentes
              escenarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Control de mantenimiento</p>
              <Select
                value={selectedControlId ? String(selectedControlId) : ''}
                onValueChange={(value) => {
                  setSelectedControlId(Number(value));
                  setSelectedAircraftId(null); // Limpiar selección de aeronave al cambiar control
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un control" />
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

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Aeronave</p>
              <Select
                value={selectedAircraftId ? String(selectedAircraftId) : ''}
                onValueChange={(value) => {
                  setSelectedAircraftId(Number(value));
                  // Limpiar valores personalizados al cambiar de aeronave
                  setCustomConsumedFH('');
                  setCustomConsumedFC('');
                  setCustomConsumedDays('');
                }}
                disabled={!selectedControlId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedControlId ? 'Selecciona una aeronave' : 'Primero selecciona un control'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectedControl?.aircrafts?.map((aircraft) => (
                    <SelectItem key={aircraft.id} value={String(aircraft.id)}>
                      {aircraft.serial} - {aircraft.acronym}
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

        {isError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">No se pudo cargar la información de los controles.</p>
            </CardContent>
          </Card>
        )}

        {!selectedControlId ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Selecciona un control para ver sus tareas.</p>
            </CardContent>
          </Card>
        ) : tasksQuery.isLoading ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Cargando tareas...</p>
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {selectedAircraftId
                  ? 'No hay tareas asignadas para esta aeronave en este control.'
                  : 'Selecciona una aeronave para ver las tareas asignadas.'}
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
                    <TableHead className="text-center">Consumido FH</TableHead>
                    <TableHead className="text-center">Consumido FC</TableHead>
                    <TableHead className="text-center">Consumido Días</TableHead>
                    <TableHead className="text-center">Última ejecución</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs text-primary">{row.code}</TableCell>
                      <TableCell className="max-w-[300px] text-xs">{row.description}</TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        <div className="flex flex-col">
                          <span className={getConsumedColor(row.consumedFH, row.intervalFH)}>
                            {formatConsumed(row.consumedFH, '')}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {formatConsumed(row.intervalFH, '')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        <div className="flex flex-col">
                          <span className={getConsumedColor(row.consumedFC, row.intervalFC)}>
                            {formatConsumed(row.consumedFC, '')}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {formatConsumed(row.intervalFC, '')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        <div className="flex flex-col">
                          <span className={getConsumedColor(row.consumedDays, row.intervalDays)}>
                            {formatConsumed(row.consumedDays, '')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {formatConsumed(row.intervalDays, '')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {row.lastExecution ? (
                          <div className="flex flex-col">
                            <span className="font-mono">
                              {new Date(row.lastExecution.executed_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              FH: {row.lastExecution.current_fh.toFixed(1)} | FC: {row.lastExecution.current_fc}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca ejecutada</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={row.status.variant} className="text-xs">
                          {row.status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCreateTaskExecution(row.id, row.code)}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ejecutar
                        </Button>
                      </TableCell>
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
