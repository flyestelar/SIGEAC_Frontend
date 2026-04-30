'use client';

import CreateAirworthinessDirectiveApplicabilityDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveApplicabilityDialog';
import CreateAirworthinessDirectiveComplianceControlDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveComplianceControlDialog';
import CreateAirworthinessDirectiveComplianceExecutionDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveComplianceExecutionDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useGetAirworthinessDirectiveApplicabilities,
  useGetAirworthinessDirectiveComplianceControls,
  useGetAirworthinessDirectiveComplianceRecords,
  useGetAirworthinessDirectiveDetail,
  useDeleteAirworthinessDirectiveApplicability,
} from '@/hooks/planificacion/directivas/queries';
import { formatDate } from '@/lib/helpers/format';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AlertCircle, ArrowLeft, CheckCheck, FileBadge2, FileText, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import type {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
} from '@api/types';

const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Card className="rounded-2xl border bg-background">
    <CardContent className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </CardContent>
  </Card>
);

const EmptyTab = ({ title, description }: { title: string; description: string }) => (
  <Card className="rounded-2xl border border-dashed bg-background">
    <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const TabTable = ({
  headers,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyTitle: string;
  emptyDescription: string;
}) => {
  if (rows.length === 0) {
    return <EmptyTab title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div
        className="grid gap-0 border-b bg-muted px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground"
        style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
      >
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>
      <div className="divide-y">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-0 px-4 py-4 text-sm"
            style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
          >
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="pr-3">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AirworthinessDirectiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const directiveId = Number(id);
  const { selectedCompany } = useCompanyStore();
  const {
    data: directiveResponse,
    isLoading,
    isError,
  } = useGetAirworthinessDirectiveDetail(Number.isFinite(directiveId) ? directiveId : undefined);
  const { data: applicabilitiesResponse, isLoading: isApplicabilitiesLoading } =
    useGetAirworthinessDirectiveApplicabilities(Number.isFinite(directiveId) ? directiveId : undefined);
  const { data: controlsResponse, isLoading: isControlsLoading } = useGetAirworthinessDirectiveComplianceControls(
    Number.isFinite(directiveId) ? directiveId : undefined,
  );
  const { data: recordsResponse, isLoading: isRecordsLoading } = useGetAirworthinessDirectiveComplianceRecords(
    Number.isFinite(directiveId) ? directiveId : undefined,
  );
  const directive = directiveResponse?.data;
  const applicabilities = useMemo(() => applicabilitiesResponse?.data ?? [], [applicabilitiesResponse?.data]);
  const controls = useMemo(() => controlsResponse?.data ?? [], [controlsResponse?.data]);
  const records = useMemo(() => recordsResponse?.data ?? [], [recordsResponse?.data]);
  const controlRows = useMemo(() => {
    const controlsByAircraftId = new Map(controls.map((item) => [Number(item.aircraft_id), item]));

    return applicabilities.filter((item) => item.is_applicable).map((item) => ({
      applicability: item,
      control: controlsByAircraftId.get(item.aircraft_id),
    }));
  }, [applicabilities, controls]);
  const [controlSearch, setControlSearch] = useState('');
  const [controlAircraftFilter, setControlAircraftFilter] = useState('all');
  const [controlSort, setControlSort] = useState<'due-soonest' | 'due-latest' | 'aircraft'>('due-soonest');
  const controlAircraftOptions = useMemo(() => {
    const uniqueAircraft = new Map<string, { value: string; label: string }>();

    controlRows.forEach(({ applicability, control }) => {
      const value = String(applicability.aircraft_id);
      if (!uniqueAircraft.has(value)) {
        uniqueAircraft.set(value, {
          value,
          label: control?.aircraft?.acronym ?? applicability.aircraft?.acronym ?? `#${applicability.aircraft_id}`,
        });
      }
    });

    return Array.from(uniqueAircraft.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [controlRows]);
  const filteredControlRows = useMemo(() => {
    const normalizedSearch = controlSearch.trim().toLowerCase();

    return [...controlRows]
      .filter(({ applicability, control }) => {
        if (controlAircraftFilter !== 'all' && String(applicability.aircraft_id) !== controlAircraftFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          control?.aircraft?.acronym,
          control?.aircraft?.model,
          applicability.aircraft?.acronym,
          applicability.aircraft?.model,
          control?.compliance_status,
          control?.urgency,
        ].some((field) => field?.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        if (controlSort === 'aircraft') {
          const leftAircraft = left.control?.aircraft?.acronym ?? left.applicability.aircraft?.acronym ?? `#${left.applicability.aircraft_id}`;
          const rightAircraft = right.control?.aircraft?.acronym ?? right.applicability.aircraft?.acronym ?? `#${right.applicability.aircraft_id}`;
          return leftAircraft.localeCompare(rightAircraft);
        }

        const leftTime = left.control?.calendar_due_date ? new Date(left.control.calendar_due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.control?.calendar_due_date ? new Date(right.control.calendar_due_date).getTime() : Number.MAX_SAFE_INTEGER;

        return controlSort === 'due-latest' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [controlAircraftFilter, controlRows, controlSearch, controlSort]);
  const [executionSearch, setExecutionSearch] = useState('');
  const [executionAircraftFilter, setExecutionAircraftFilter] = useState('all');
  const [executionSort, setExecutionSort] = useState<'newest' | 'oldest' | 'aircraft'>('newest');
  const executionAircraftOptions = useMemo(() => {
    const uniqueAircraft = new Map<string, { value: string; label: string }>();

    records.forEach((record) => {
      const value = String(record.aircraft_id);
      if (!uniqueAircraft.has(value)) {
        uniqueAircraft.set(value, {
          value,
          label: record.aircraft?.acronym ?? `#${record.aircraft_id}`,
        });
      }
    });

    return Array.from(uniqueAircraft.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [records]);
  const filteredExecutionRecords = useMemo(() => {
    const normalizedSearch = executionSearch.trim().toLowerCase();

    return [...records]
      .filter((record) => {
        if (executionAircraftFilter !== 'all' && String(record.aircraft_id) !== executionAircraftFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          record.work_order_number,
          record.inspector_license_signature,
          record.remarks,
          record.aircraft?.acronym,
        ].some((field) => field?.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        if (executionSort === 'aircraft') {
          return (left.aircraft?.acronym ?? `#${left.aircraft_id}`).localeCompare(
            right.aircraft?.acronym ?? `#${right.aircraft_id}`,
          );
        }

        const leftTime = left.execution_date ? new Date(left.execution_date).getTime() : 0;
        const rightTime = right.execution_date ? new Date(right.execution_date).getTime() : 0;

        return executionSort === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
      });
  }, [executionAircraftFilter, executionSearch, executionSort, records]);
  const resetControlFilters = () => {
    setControlSearch('');
    setControlAircraftFilter('all');
    setControlSort('due-soonest');
  };
  const resetExecutionFilters = () => {
    setExecutionSearch('');
    setExecutionAircraftFilter('all');
    setExecutionSort('newest');
  };
  const summary = directive?.summary;
  const [isCreateApplicabilityOpen, setIsCreateApplicabilityOpen] = useState(false);
  const [applicabilityToEdit, setApplicabilityToEdit] = useState<AirworthinessDirectiveApplicabilityResource | undefined>();
  const [applicabilityToDelete, setApplicabilityToDelete] = useState<AirworthinessDirectiveApplicabilityResource | undefined>();
  const [controlApplicability, setControlApplicability] = useState<AirworthinessDirectiveApplicabilityResource | undefined>();
  const [controlToEdit, setControlToEdit] = useState<AirworthinessDirectiveComplianceControlResource | undefined>();
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [executionApplicability, setExecutionApplicability] = useState<AirworthinessDirectiveApplicabilityResource | undefined>();
  const [executionControl, setExecutionControl] = useState<AirworthinessDirectiveComplianceControlResource | undefined>();
  const [isExecutionDialogOpen, setIsExecutionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteApplicability = useDeleteAirworthinessDirectiveApplicability(Number.isFinite(directiveId) ? directiveId : undefined);
  const existingAircraftIds = useMemo(() => applicabilities.map((item) => item.aircraft_id), [applicabilities]);

  const openCreateApplicability = () => {
    setApplicabilityToEdit(undefined);
    setIsCreateApplicabilityOpen(true);
  };

  const openEditApplicability = (applicability: AirworthinessDirectiveApplicabilityResource) => {
    setApplicabilityToEdit(applicability);
    setIsCreateApplicabilityOpen(true);
  };

  const closeApplicabilityDialog = (open: boolean) => {
    setIsCreateApplicabilityOpen(open);
    if (!open) {
      setApplicabilityToEdit(undefined);
    }
  };

  const openDeleteApplicability = (applicability: AirworthinessDirectiveApplicabilityResource) => {
    setApplicabilityToDelete(applicability);
    setIsDeleteDialogOpen(true);
  };

  const openControlDialog = (
    applicability: AirworthinessDirectiveApplicabilityResource,
    control?: AirworthinessDirectiveComplianceControlResource,
  ) => {
    setControlApplicability(applicability);
    setControlToEdit(control);
    setIsControlDialogOpen(true);
  };

  const closeControlDialog = (open: boolean) => {
    setIsControlDialogOpen(open);
    if (!open) {
      setControlApplicability(undefined);
      setControlToEdit(undefined);
    }
  };

  const openExecutionDialog = (
    applicability: AirworthinessDirectiveApplicabilityResource,
    control: AirworthinessDirectiveComplianceControlResource,
  ) => {
    setExecutionApplicability(applicability);
    setExecutionControl(control);
    setIsExecutionDialogOpen(true);
  };

  const closeExecutionDialog = (open: boolean) => {
    setIsExecutionDialogOpen(open);
    if (!open) {
      setExecutionApplicability(undefined);
      setExecutionControl(undefined);
    }
  };

  const closeDeleteApplicabilityDialog = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setApplicabilityToDelete(undefined);
    }
  };

  const handleDeleteApplicability = async () => {
    if (!applicabilityToDelete) return;

    await deleteApplicability.mutateAsync({
      path: { directiveId, applicabilityId: applicabilityToDelete.id },
    });

    if (applicabilityToEdit?.id === applicabilityToDelete.id) {
      setApplicabilityToEdit(undefined);
      setIsCreateApplicabilityOpen(false);
    }

    setApplicabilityToDelete(undefined);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) return <LoadingPage />;

  if (isError || !directive) {
    return (
      <ContentLayout title="Directiva de Aeronavegabilidad">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>No se pudo cargar la directiva solicitada.</AlertDescription>
        </Alert>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={directive.ad_number}>
      <div className="space-y-6 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Link href={`/${selectedCompany?.slug}/planificacion/directivas`} className="inline-flex">
              <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Volver al índice
              </Button>
            </Link>

            <div className="flex items-center gap-2 text-muted-foreground">
              <FileBadge2 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Directiva</span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-2xl font-semibold tracking-wide">{directive.ad_number}</h1>
                {directive.is_recurring && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                    Recurrente
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{directive.authority}</p>
              <p className="mt-3 max-w-4xl text-sm text-foreground/80">
                {directive.subject_description || 'Sin descripción registrada para esta directiva.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={!directive.pdf_document} className="gap-2">
              <FileText className="h-4 w-4" />
              Ver PDF
            </Button>
            <Button size="sm" disabled>
              Editar directiva
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl border bg-background sm:col-span-2 xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos base</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Autoridad</p>
                <p className="mt-1 text-sm font-medium">{directive.authority}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Emisión</p>
                <p className="mt-1 text-sm font-medium">{formatDate(directive.issue_date)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vigencia</p>
                <p className="mt-1 text-sm font-medium">{formatDate(directive.effective_date)}</p>
              </div>
            </CardContent>
          </Card>

          <StatCard label="Tipo" value={directive.is_recurring ? 'Recurrente' : 'Única'} />
          <StatCard
            label="Documento"
            value={(summary?.has_pdf_document ?? Boolean(directive.pdf_document)) ? 'Disponible' : 'Pendiente'}
          />
        </div>

        <Alert>
          <ShieldCheck className="size-4" />
          <AlertDescription>
            Detalle conectado al contrato real: resumen, aplicabilidades, controles y ejecuciones.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="applicability">Aplicabilidad</TabsTrigger>
            <TabsTrigger value="control">Control</TabsTrigger>
            <TabsTrigger value="executions">Ejecuciones</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Evaluadas" value={summary?.total_aircraft_evaluated ?? 0} />
              <StatCard label="Aplicables" value={summary?.total_applicable_aircraft ?? 0} />
              <StatCard label="No aplicables" value={summary?.total_non_applicable_aircraft ?? 0} />
              <StatCard label="Pend. config." value={summary?.pending_configuration_count ?? 0} />
              <StatCard label="Controles abiertos" value={summary?.total_open_controls ?? 0} />
              <StatCard label="Controles cerrados" value={summary?.total_closed_controls ?? 0} />
              <StatCard label="Recurrentes" value={summary?.total_recurrent_controls ?? 0} />
              <StatCard
                label="Próximas / Vencidas"
                value={`${summary?.upcoming_due_count ?? 0} / ${summary?.overdue_count ?? 0}`}
              />
            </div>
          </TabsContent>

          <TabsContent value="applicability">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={openCreateApplicability}>
                Nueva aplicabilidad
              </Button>
            </div>
            <CreateAirworthinessDirectiveApplicabilityDialog
              directiveId={directiveId}
              existingAircraftIds={existingAircraftIds}
              applicability={applicabilityToEdit}
              open={isCreateApplicabilityOpen}
              onOpenChange={closeApplicabilityDialog}
            />
            {isApplicabilitiesLoading ? (
              <LoadingPage />
            ) : (
              <TabTable
                headers={['Aeronave', 'Aplica', 'Motivo', 'AMOC', 'Acciones']}
                rows={applicabilities.map((item) => [
                  <div key={`${item.id}-aircraft`}>
                    <p className="font-medium">{item.aircraft?.acronym ?? `#${item.aircraft_id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.aircraft?.aircraft_type?.full_name ?? item.aircraft?.model ?? 'Sin modelo'}
                    </p>
                  </div>,
                  item.is_applicable ? (
                    <Badge
                      key={`${item.id}-app`}
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                    >
                      Aplica
                    </Badge>
                  ) : (
                    <Badge
                      key={`${item.id}-no-app`}
                      variant="outline"
                      className="border-slate-500/30 bg-slate-500/10 text-slate-700"
                    >
                      No aplica
                    </Badge>
                  ),
                  item.non_applicability_reason || '—',
                  item.amoc_approved_method || '—',
                  <div key={`${item.id}-actions`} className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditApplicability(item)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar aplicabilidad</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteApplicability(item)}
                      disabled={deleteApplicability.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar aplicabilidad</span>
                    </Button>
                  </div>,
                ])}
                emptyTitle="Sin aplicabilidades"
                emptyDescription="Esta directiva todavía no tiene aeronaves evaluadas en aplicabilidad."
              />
            )}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={closeDeleteApplicabilityDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar aplicabilidad</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La aplicabilidad de{' '}
                    {applicabilityToDelete?.aircraft?.acronym ?? applicabilityToDelete?.aircraft_id} será eliminada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteApplicability.isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteApplicability} disabled={deleteApplicability.isPending}>
                    {deleteApplicability.isPending ? 'Eliminando...' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="control">
            {isControlsLoading ? (
              <LoadingPage />
            ) : controlRows.length === 0 ? (
              <EmptyTab
                title="Sin aeronaves aplicables"
                description="Primero registra aplicabilidades con estado aplica para poder configurar controles de cumplimiento."
              />
            ) : (
              <>
                <div className="mb-4 space-y-4">
                  <div className="grid gap-3 rounded-2xl border bg-background p-4 md:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={controlSearch}
                        onChange={(event) => setControlSearch(event.target.value)}
                        placeholder="Buscar por aeronave, estado o urgencia"
                        className="pl-10"
                      />
                    </div>

                    <Select value={controlAircraftFilter} onValueChange={setControlAircraftFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por aeronave" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las aeronaves</SelectItem>
                        {controlAircraftOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={controlSort}
                      onValueChange={(value) => setControlSort(value as 'due-soonest' | 'due-latest' | 'aircraft')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due-soonest">Vence primero</SelectItem>
                        <SelectItem value="due-latest">Vence después</SelectItem>
                        <SelectItem value="aircraft">Aeronave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(controlSearch || controlAircraftFilter !== 'all' || controlSort !== 'due-soonest') && (
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={resetControlFilters}>
                        <RotateCcw className="h-4 w-4" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>

                <TabTable
                  headers={['Aeronave', 'Vence', 'FH', 'FC', 'Rec. días', 'Rec. horas', 'Rec. ciclos', 'Estado', 'Urgencia', 'Acciones']}
                rows={filteredControlRows.map(({ applicability, control }) => [
                  <div key={`${applicability.id}-aircraft`}>
                    <p className="font-medium">{control?.aircraft?.acronym ?? applicability.aircraft?.acronym ?? `#${applicability.aircraft_id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {control?.aircraft?.aircraft_type?.full_name ??
                        control?.aircraft?.model ??
                        applicability.aircraft?.aircraft_type?.full_name ??
                        applicability.aircraft?.model ??
                        'Sin modelo'}
                    </p>
                  </div>,
                  formatDate(control?.calendar_due_date ?? null),
                  control?.flight_hours_due ?? '—',
                  control?.cycles_due ?? '—',
                  control?.recurrence_interval_days ?? '—',
                  control?.recurrence_interval_hours ?? '—',
                  control?.recurrence_interval_cycles ?? '—',
                  control ? (
                    <Badge key={`${applicability.id}-status`} variant="outline">
                      {control.compliance_status}
                    </Badge>
                  ) : (
                    <Badge
                      key={`${applicability.id}-pending-status`}
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-700"
                    >
                      Pendiente de configurar
                    </Badge>
                  ),
                  control?.urgency ? (
                    <Badge key={`${applicability.id}-urgency`} variant="outline">
                      {control.urgency}
                    </Badge>
                  ) : (
                    <Badge
                      key={`${applicability.id}-pending-urgency`}
                      variant="outline"
                      className="border-slate-500/30 bg-slate-500/10 text-slate-700"
                    >
                      Pendiente de configurar
                    </Badge>
                  ),
                  <div key={`${applicability.id}-actions`} className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openControlDialog(applicability, control)}>
                      {control ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      <span className="sr-only">{control ? 'Editar control' : 'Crear control'}</span>
                    </Button>
                    {control && (
                      <Button variant="ghost" size="icon" onClick={() => openExecutionDialog(applicability, control)}>
                        <CheckCheck className="h-4 w-4" />
                        <span className="sr-only">Registrar cumplimiento</span>
                      </Button>
                    )}
                  </div>,
                ])}
                emptyTitle={controlRows.length === 0 ? 'Sin controles' : 'Sin coincidencias'}
                emptyDescription={
                  controlRows.length === 0
                    ? 'No hay controles de cumplimiento registrados para esta directiva.'
                    : 'No hay controles que coincidan con los filtros actuales.'
                }
                />

                {controlApplicability && (
                  <CreateAirworthinessDirectiveComplianceControlDialog
                    directiveId={directiveId}
                    applicability={controlApplicability}
                    control={controlToEdit}
                    open={isControlDialogOpen}
                    onOpenChange={closeControlDialog}
                  />
                )}

                {executionApplicability && executionControl && (
                  <CreateAirworthinessDirectiveComplianceExecutionDialog
                    directiveId={directiveId}
                    applicability={executionApplicability}
                    control={executionControl}
                    open={isExecutionDialogOpen}
                    onOpenChange={closeExecutionDialog}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="executions">
            {isRecordsLoading ? (
              <LoadingPage />
            ) : (
              <div className="space-y-4">
                {records.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid gap-3 rounded-2xl border bg-background p-4 md:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={executionSearch}
                          onChange={(event) => setExecutionSearch(event.target.value)}
                          placeholder="Buscar por OT, inspector, aeronave u observación"
                          className="pl-10"
                        />
                      </div>

                      <Select value={executionAircraftFilter} onValueChange={setExecutionAircraftFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por aeronave" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las aeronaves</SelectItem>
                          {executionAircraftOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={executionSort}
                        onValueChange={(value) => setExecutionSort(value as 'newest' | 'oldest' | 'aircraft')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Fecha más reciente</SelectItem>
                          <SelectItem value="oldest">Fecha más antigua</SelectItem>
                          <SelectItem value="aircraft">Aeronave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(executionSearch || executionAircraftFilter !== 'all' || executionSort !== 'newest') && (
                      <div className="flex justify-end">
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={resetExecutionFilters}>
                          <RotateCcw className="h-4 w-4" />
                          Limpiar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <TabTable
                  headers={['Aeronave', 'OT', 'Fecha', 'FH', 'FC', 'Inspector']}
                  rows={filteredExecutionRecords.map((item) => [
                    <div key={`${item.id}-aircraft`}>
                      <p className="font-medium">{item.aircraft?.acronym ?? `#${item.aircraft_id}`}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.remarks || 'Sin observación'}</p>
                    </div>,
                    item.work_order_number,
                    formatDate(item.execution_date),
                    item.flight_hours_at_execution ?? '—',
                    item.cycles_at_execution ?? '—',
                    item.inspector_license_signature,
                  ])}
                  emptyTitle={records.length === 0 ? 'Sin ejecuciones' : 'Sin coincidencias'}
                  emptyDescription={
                    records.length === 0
                      ? 'No hay historial de cumplimiento para esta directiva todavía.'
                      : 'No hay ejecuciones que coincidan con los filtros actuales.'
                  }
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  );
}
