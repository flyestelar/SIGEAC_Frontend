'use client';

import CreateAirworthinessDirectiveApplicabilityDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveApplicabilityDialog';
import CreateAirworthinessDirectiveComplianceControlDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveComplianceControlDialog';
import CreateAirworthinessDirectiveComplianceExecutionDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveComplianceExecutionDialog';
import EditAirworthinessDirectiveDialog from '@/components/dialogs/planificacion/directivas/EditAirworthinessDirectiveDialog';
import ViewAirworthinessDirectivePdfDialog from '@/components/dialogs/planificacion/directivas/ViewAirworthinessDirectivePdfDialog';
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
  useDeleteAirworthinessDirectiveApplicability,
  useGetAirworthinessDirectiveApplicabilities,
  useGetAirworthinessDirectiveComplianceControls,
  useGetAirworthinessDirectiveComplianceRecords,
  useGetAirworthinessDirectiveDetail,
} from '@/hooks/planificacion/directivas/queries';
import { formatDate } from '@/lib/helpers/format';
import { useDebouncedInput } from '@/lib/useDebounce';
import { useCompanyStore } from '@/stores/CompanyStore';
import {
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  FileBadge2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import type {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
} from '@api/types';

const getComplianceStatusBadgeClass = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes('overdue') || normalized.includes('venc')) {
    return 'border-red-500/30 bg-red-500/10 text-red-700';
  }

  if (normalized.includes('upcoming') || normalized.includes('proxim')) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
  }

  if (normalized.includes('closed') || normalized.includes('cerr')) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700';
  }

  return 'border-slate-500/30 bg-slate-500/10 text-slate-700';
};

const getUrgencyBadgeClass = (urgency: string) => {
  const normalized = urgency.toLowerCase();

  if (normalized.includes('critical') || normalized.includes('aog') || normalized.includes('alta')) {
    return 'border-red-500/30 bg-red-500/10 text-red-700';
  }

  if (normalized.includes('medium') || normalized.includes('media')) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-700';
  }

  return 'border-slate-500/30 bg-slate-500/10 text-slate-700';
};

const CompactStat = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success' | 'info';
}) => {
  const toneClass = {
    default: 'border-border bg-background text-foreground',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
    danger: 'border-red-500/30 bg-red-500/10 text-red-700',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
  }[tone];

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
    </div>
  );
};

const MetaItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1 border-l pl-3 first:border-l-0 first:pl-0">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <div className="text-sm font-medium text-foreground">{value}</div>
  </div>
);

const EmptyTab = ({ title, description }: { title: string; description: string }) => (
  <Card className="rounded-lg border border-dashed bg-background">
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
    <div className="overflow-hidden rounded-lg border bg-background">
      <div
        className="grid gap-0 border-b bg-muted/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
            className="grid gap-0 px-4 py-4 text-sm transition-colors hover:bg-muted/40"
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
  const complianceListPerPage = 10;
  const { id } = useParams<{ id: string }>();
  const directiveId = Number(id);
  const { selectedCompany } = useCompanyStore();
  const [controlSearch, setControlSearch] = useState('');
  const [controlSearchInput, setControlSearchInput] = useDebouncedInput('', setControlSearch, 350);
  const [controlAircraftFilter, setControlAircraftFilter] = useState('all');
  const [controlSort, setControlSort] = useState<'newest' | 'oldest' | 'aircraft'>('oldest');
  const [controlPage, setControlPage] = useState(1);
  const [executionSearch, setExecutionSearch] = useState('');
  const [executionSearchInput, setExecutionSearchInput] = useDebouncedInput('', setExecutionSearch, 350);
  const [executionAircraftFilter, setExecutionAircraftFilter] = useState('all');
  const [executionSort, setExecutionSort] = useState<'newest' | 'oldest' | 'aircraft'>('newest');
  const [executionPage, setExecutionPage] = useState(1);

  const {
    data: directiveResponse,
    isLoading,
    isError,
  } = useGetAirworthinessDirectiveDetail(Number.isFinite(directiveId) ? directiveId : undefined);
  const { data: applicabilitiesResponse, isLoading: isApplicabilitiesLoading } =
    useGetAirworthinessDirectiveApplicabilities(Number.isFinite(directiveId) ? directiveId : undefined);
  const { data: controlsResponse, isLoading: isControlsLoading } = useGetAirworthinessDirectiveComplianceControls(
    Number.isFinite(directiveId) ? directiveId : undefined,
    {
      search: controlSearch || undefined,
      aircraft_id: controlAircraftFilter !== 'all' ? Number(controlAircraftFilter) : undefined,
      order_by: controlSort,
      page: controlPage,
      per_page: complianceListPerPage,
    },
  );
  const { data: recordsResponse, isLoading: isRecordsLoading } = useGetAirworthinessDirectiveComplianceRecords(
    Number.isFinite(directiveId) ? directiveId : undefined,
    {
      search: executionSearch || undefined,
      aircraft_id: executionAircraftFilter !== 'all' ? Number(executionAircraftFilter) : undefined,
      order_by: executionSort,
      page: executionPage,
      per_page: complianceListPerPage,
    },
  );

  const directive = directiveResponse?.data;
  const summary = directive?.summary;
  const applicabilities = useMemo(() => applicabilitiesResponse?.data ?? [], [applicabilitiesResponse?.data]);
  const controls = useMemo(() => controlsResponse?.data ?? [], [controlsResponse?.data]);
  const records = useMemo(() => recordsResponse?.data ?? [], [recordsResponse?.data]);

  const pendingControlRows = useMemo(() => {
    const controlsByAircraftId = new Map(controls.map((item) => [Number(item.aircraft_id), item]));

    return applicabilities.filter((item) => item.is_applicable).map((item) => ({
      applicability: item,
      control: controlsByAircraftId.get(item.aircraft_id),
    }));
  }, [applicabilities, controls]);

  const controlAircraftOptions = useMemo(() => {
    const uniqueAircraft = new Map<string, { value: string; label: string }>();

    applicabilities.filter((item) => item.is_applicable).forEach((applicability) => {
      const value = String(applicability.aircraft_id);
      if (!uniqueAircraft.has(value)) {
        uniqueAircraft.set(value, {
          value,
          label: applicability.aircraft?.acronym ?? `#${applicability.aircraft_id}`,
        });
      }
    });

    return Array.from(uniqueAircraft.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [applicabilities]);

  const controlRows = useMemo(() => {
    const hasServerFilters = Boolean(
      controlSearch || controlAircraftFilter !== 'all' || controlSort !== 'oldest' || controlPage > 1,
    );

    const controlOnlyRows = controls
      .map((control) => {
        const applicability = applicabilities.find(
          (item) => item.aircraft_id === Number(control.aircraft_id) && item.is_applicable,
        );
        return applicability ? { applicability, control } : undefined;
      })
      .filter(
        (
          item,
        ): item is {
          applicability: AirworthinessDirectiveApplicabilityResource;
          control: AirworthinessDirectiveComplianceControlResource;
        } => Boolean(item),
      );

    if (hasServerFilters) {
      return controlOnlyRows;
    }

    const pendingRows = pendingControlRows.filter((item) => !item.control);
    return [...pendingRows, ...controlOnlyRows];
  }, [applicabilities, controlAircraftFilter, controlPage, controlSearch, controlSort, controls, pendingControlRows]);

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

  const resetControlFilters = () => {
    setControlSearchInput('');
    setControlAircraftFilter('all');
    setControlSort('oldest');
    setControlPage(1);
  };

  const resetExecutionFilters = () => {
    setExecutionSearchInput('');
    setExecutionAircraftFilter('all');
    setExecutionSort('newest');
    setExecutionPage(1);
  };

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
  const [isEditDirectiveOpen, setIsEditDirectiveOpen] = useState(false);

  const deleteApplicability = useDeleteAirworthinessDirectiveApplicability(
    Number.isFinite(directiveId) ? directiveId : undefined,
  );
  const existingAircraftIds = useMemo(
    () =>
      Array.from(
        new Set(
          applicabilities
            .map((item) => item.aircraft?.id ?? item.aircraft_id)
            .filter((aircraftId): aircraftId is number => Number.isFinite(aircraftId)),
        ),
      ),
    [applicabilities],
  );

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
      <div className="space-y-4 py-4">
        <Card className="overflow-hidden rounded-lg border bg-background">
          <CardContent className="space-y-4 p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-3">
                <Link href={`/${selectedCompany?.slug}/planificacion/directivas`} className="inline-flex">
                  <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al índice
                  </Button>
                </Link>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileBadge2 className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.22em]">Directiva</span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-mono text-2xl font-semibold tracking-wide">{directive.ad_number}</h1>
                    <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-700">
                      {directive.authority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        directive.is_recurring
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                          : 'border-slate-500/30 bg-slate-500/10 text-slate-700'
                      }
                    >
                      {directive.is_recurring ? 'Recurrente' : 'Única'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        summary?.has_pdf_document ?? Boolean(directive.pdf_document_url)
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                      }
                    >
                      {summary?.has_pdf_document ?? Boolean(directive.pdf_document_url)
                        ? 'PDF disponible'
                        : 'PDF pendiente'}
                    </Badge>
                  </div>

                  <p className="max-w-4xl text-sm leading-6 text-foreground/80">
                    {directive.subject_description || 'Sin descripción registrada para esta directiva.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <ViewAirworthinessDirectivePdfDialog
                  adNumber={directive.ad_number}
                  pdfUrl={directive.pdf_document_url}
                />
                <Button size="sm" onClick={() => setIsEditDirectiveOpen(true)}>
                  Editar directiva
                </Button>
              </div>
            </div>

            <div className="grid gap-3 border-t pt-4 md:grid-cols-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
              <MetaItem label="Emisión" value={formatDate(directive.issue_date)} />
              <MetaItem label="Vigencia" value={formatDate(directive.effective_date)} />
              <MetaItem
                label="Evaluadas / Aplicables"
                value={`${summary?.total_aircraft_evaluated ?? 0} / ${summary?.total_applicable_aircraft ?? 0}`}
              />
              <MetaItem label="Pendientes config." value={summary?.pending_configuration_count ?? 0} />
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
              <CompactStat label="Abiertos" value={summary?.total_open_controls ?? 0} tone="warning" />
              <CompactStat label="Cerrados" value={summary?.total_closed_controls ?? 0} tone="success" />
              <CompactStat label="Recurrentes" value={summary?.total_recurrent_controls ?? 0} />
              <CompactStat label="Próximas" value={summary?.upcoming_due_count ?? 0} tone="info" />
              <CompactStat label="Vencidas" value={summary?.overdue_count ?? 0} tone="danger" />
              <div className="rounded-md border border-sky-500/30 bg-sky-500/5 px-3 py-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-sky-700" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Estado de detalle
                    </p>
                    <p className="mt-1 text-xs leading-5 text-foreground/75">
                      Conectado a aplicabilidad, control y ejecuciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border bg-muted/40 p-1">
            <TabsTrigger value="summary" className="text-[11px] uppercase tracking-[0.16em]">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="applicability" className="text-[11px] uppercase tracking-[0.16em]">
              Aplicabilidad
            </TabsTrigger>
            <TabsTrigger value="control" className="text-[11px] uppercase tracking-[0.16em]">
              Control
            </TabsTrigger>
            <TabsTrigger value="executions" className="text-[11px] uppercase tracking-[0.16em]">
              Ejecuciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card className="rounded-lg border bg-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    Cobertura de flota
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <CompactStat label="Evaluadas" value={summary?.total_aircraft_evaluated ?? 0} />
                  <CompactStat
                    label="Aplicables"
                    value={summary?.total_applicable_aircraft ?? 0}
                    tone="success"
                  />
                  <CompactStat label="No aplicables" value={summary?.total_non_applicable_aircraft ?? 0} />
                  <CompactStat
                    label="Pend. config."
                    value={summary?.pending_configuration_count ?? 0}
                    tone="warning"
                  />
                </CardContent>
              </Card>

              <Card className="rounded-lg border bg-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    Seguimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                  <CompactStat label="Abiertos" value={summary?.total_open_controls ?? 0} tone="warning" />
                  <CompactStat label="Cerrados" value={summary?.total_closed_controls ?? 0} tone="success" />
                  <CompactStat label="Recurrentes" value={summary?.total_recurrent_controls ?? 0} />
                  <CompactStat
                    label="Próx. / Venc."
                    value={`${summary?.upcoming_due_count ?? 0} / ${summary?.overdue_count ?? 0}`}
                    tone="danger"
                  />
                </CardContent>
              </Card>
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
                    {applicabilityToDelete?.aircraft?.acronym ?? applicabilityToDelete?.aircraft_id} será
                    eliminada.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteApplicability.isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteApplicability}
                    disabled={deleteApplicability.isPending}
                  >
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
                  <div className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={controlSearchInput}
                        onChange={(event) => {
                          setControlSearchInput(event.target.value);
                          setControlPage(1);
                        }}
                        placeholder="Buscar por aeronave, estado o urgencia"
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={controlAircraftFilter}
                      onValueChange={(value) => {
                        setControlAircraftFilter(value);
                        setControlPage(1);
                      }}
                    >
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
                      onValueChange={(value) => {
                        setControlSort(value as 'newest' | 'oldest' | 'aircraft');
                        setControlPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oldest">Vence primero</SelectItem>
                        <SelectItem value="newest">Vence después</SelectItem>
                        <SelectItem value="aircraft">Aeronave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(controlSearchInput ||
                    controlAircraftFilter !== 'all' ||
                    controlSort !== 'oldest' ||
                    controlPage > 1) && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={resetControlFilters}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>

                <TabTable
                  headers={[
                    'Aeronave',
                    'Vence',
                    'FH',
                    'FC',
                    'Rec. días',
                    'Rec. horas',
                    'Rec. ciclos',
                    'Estado',
                    'Urgencia',
                    'Acciones',
                  ]}
                  rows={controlRows.map(({ applicability, control }) => [
                    <div key={`${applicability.id}-aircraft`}>
                      <p className="font-medium">
                        {control?.aircraft?.acronym ?? applicability.aircraft?.acronym ?? `#${applicability.aircraft_id}`}
                      </p>
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
                      <Badge
                        key={`${applicability.id}-status`}
                        variant="outline"
                        className={getComplianceStatusBadgeClass(control.compliance_status)}
                      >
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
                      <Badge
                        key={`${applicability.id}-urgency`}
                        variant="outline"
                        className={getUrgencyBadgeClass(control.urgency)}
                      >
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openExecutionDialog(applicability, control)}
                        >
                          <CheckCheck className="h-4 w-4" />
                          <span className="sr-only">Registrar cumplimiento</span>
                        </Button>
                      )}
                    </div>,
                  ])}
                  emptyTitle="Sin coincidencias"
                  emptyDescription="No hay controles que coincidan con los filtros actuales."
                />

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setControlPage((current) => Math.max(1, current - 1))}
                    disabled={controlPage === 1 || isControlsLoading}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">Página {controlPage}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setControlPage((current) => current + 1)}
                    disabled={controls.length < complianceListPerPage || isControlsLoading}
                  >
                    Siguiente
                  </Button>
                </div>

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
                    <div className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={executionSearchInput}
                          onChange={(event) => {
                            setExecutionSearchInput(event.target.value);
                            setExecutionPage(1);
                          }}
                          placeholder="Buscar por OT, inspector, aeronave u observación"
                          className="pl-10"
                        />
                      </div>

                      <Select
                        value={executionAircraftFilter}
                        onValueChange={(value) => {
                          setExecutionAircraftFilter(value);
                          setExecutionPage(1);
                        }}
                      >
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
                        onValueChange={(value) => {
                          setExecutionSort(value as 'newest' | 'oldest' | 'aircraft');
                          setExecutionPage(1);
                        }}
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

                    {(executionSearchInput ||
                      executionAircraftFilter !== 'all' ||
                      executionSort !== 'newest' ||
                      executionPage > 1) && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={resetExecutionFilters}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Limpiar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <TabTable
                  headers={['Aeronave', 'OT', 'Fecha', 'FH', 'FC', 'Inspector']}
                  rows={records.map((item) => [
                    <div key={`${item.id}-aircraft`}>
                      <p className="font-medium">{item.aircraft?.acronym ?? `#${item.aircraft_id}`}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.remarks || 'Sin observación'}
                      </p>
                    </div>,
                    item.work_order_number,
                    formatDate(item.execution_date),
                    item.flight_hours_at_execution ?? '—',
                    item.cycles_at_execution ?? '—',
                    item.inspector_license_signature,
                  ])}
                  emptyTitle="Sin coincidencias"
                  emptyDescription="No hay ejecuciones que coincidan con los filtros actuales."
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExecutionPage((current) => Math.max(1, current - 1))}
                    disabled={executionPage === 1 || isRecordsLoading}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">Página {executionPage}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExecutionPage((current) => current + 1)}
                    disabled={records.length < complianceListPerPage || isRecordsLoading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EditAirworthinessDirectiveDialog
        directive={directive}
        open={isEditDirectiveOpen}
        onOpenChange={setIsEditDirectiveOpen}
      />
    </ContentLayout>
  );
}
