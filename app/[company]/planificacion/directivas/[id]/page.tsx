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
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
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
import { useMemo, useState } from 'react';
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
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success' | 'info';
  hint?: string;
}) => {
  const toneClass = {
    default: 'border-border/80 bg-background text-foreground',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
    danger: 'border-red-500/30 bg-red-500/10 text-red-700',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
  }[tone];

  return (
    <div className={cn('rounded-2xl border px-3 py-3 shadow-sm', toneClass)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-75">{hint}</p> : null}
    </div>
  );
};

const MetaItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const EmptyTab = ({ title, description }: { title: string; description: string }) => (
  <Card className="rounded-3xl border border-dashed bg-background">
    <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const InlineMetric = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="min-w-0 rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
  </div>
);

const TabSummaryPill = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success' | 'info';
}) => {
  const toneClass = {
    default: 'border-border/70 bg-background',
    warning: 'border-amber-500/30 bg-amber-500/10',
    danger: 'border-red-500/30 bg-red-500/10',
    success: 'border-emerald-500/30 bg-emerald-500/10',
    info: 'border-sky-500/30 bg-sky-500/10',
  }[tone];

  return (
    <div className={cn('rounded-full border px-3 py-1.5', toneClass)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="ml-2 text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
};

const SectionCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Card className={cn('rounded-3xl border bg-background shadow-sm', className)}>
    <CardContent className="p-4 md:p-5">{children}</CardContent>
  </Card>
);

export default function AirworthinessDirectiveDetailPage() {
  const complianceListPerPage = 10;
  const { id } = useParams<{ id: string }>();
  const directiveId = Number(id);
  const { selectedCompany } = useCompanyStore();
  const [controlSearch, setControlSearch] = useState('');
  const [controlSearchInput, setControlSearchInput] = useDebouncedInput('', setControlSearch, 350);
  const [controlSort, setControlSort] = useState<'newest' | 'oldest'>('oldest');
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

  const applicableAircraft = useMemo(() => applicabilities.filter((item) => item.is_applicable), [applicabilities]);

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
  const [applicabilityToEdit, setApplicabilityToEdit] = useState<
    AirworthinessDirectiveApplicabilityResource | undefined
  >();
  const [applicabilityToDelete, setApplicabilityToDelete] = useState<
    AirworthinessDirectiveApplicabilityResource | undefined
  >();
  const [controlToEdit, setControlToEdit] = useState<AirworthinessDirectiveComplianceControlResource | undefined>();
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);
  const [executionControl, setExecutionControl] = useState<
    AirworthinessDirectiveComplianceControlResource | undefined
  >();
  const [isExecutionDialogOpen, setIsExecutionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDirectiveOpen, setIsEditDirectiveOpen] = useState(false);

  const deleteApplicability = useDeleteAirworthinessDirectiveApplicability(
    Number.isFinite(directiveId) ? directiveId : undefined,
  );
  const existingAircraftIds = useMemo(() => {
    const result = new Set<number>();

    for (const item of applicabilities) {
      const aircraftId = item.aircraft?.id ?? item.aircraft_id;
      if (Number.isFinite(aircraftId)) {
        result.add(aircraftId);
      }
    }

    return Array.from(result);
  }, [applicabilities]);

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

  const openControlDialog = (control?: AirworthinessDirectiveComplianceControlResource) => {
    setControlToEdit(control);
    setIsControlDialogOpen(true);
  };

  const closeControlDialog = (open: boolean) => {
    setIsControlDialogOpen(open);
    if (!open) {
      setControlToEdit(undefined);
    }
  };

  const openExecutionDialog = (control: AirworthinessDirectiveComplianceControlResource) => {
    setExecutionControl(control);
    setIsExecutionDialogOpen(true);
  };

  const closeExecutionDialog = (open: boolean) => {
    setIsExecutionDialogOpen(open);
    if (!open) {
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

  const hasControlFilters = Boolean(controlSearchInput || controlSort !== 'oldest' || controlPage > 1);
  const hasExecutionFilters = Boolean(
    executionSearchInput || executionAircraftFilter !== 'all' || executionSort !== 'newest' || executionPage > 1,
  );

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
      <div className="space-y-5 py-4">
        <SectionCard className="overflow-hidden border-slate-200/80 bg-gradient-to-br from-background via-background to-slate-50/60">
          <div className="space-y-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-4">
                <Link href={`/${selectedCompany?.slug}/planificacion/directivas`} className="inline-flex">
                  <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground hover:bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al índice
                  </Button>
                </Link>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileBadge2 className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Directiva</span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-mono text-3xl font-semibold tracking-[0.08em]">{directive.ad_number}</h1>
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
                        (summary?.has_pdf_document ?? Boolean(directive.pdf_document_url))
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                      }
                    >
                      {(summary?.has_pdf_document ?? Boolean(directive.pdf_document_url))
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

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetaItem label="Emisión" value={formatDate(directive.issue_date)} />
              <MetaItem label="Vigencia" value={formatDate(directive.effective_date)} />
              <MetaItem
                label="Evaluadas / Aplicables"
                value={`${summary?.total_aircraft_evaluated ?? 0} / ${summary?.total_applicable_aircraft ?? 0}`}
              />
              <MetaItem label="Pendientes config." value={summary?.pending_configuration_count ?? 0} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Cobertura de flota
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Qué aeronaves fueron evaluadas y cómo quedó su aplicabilidad.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <CompactStat label="Evaluadas" value={summary?.total_aircraft_evaluated ?? 0} />
                  <CompactStat label="Aplicables" value={summary?.total_applicable_aircraft ?? 0} tone="success" />
                  <CompactStat label="No aplicables" value={summary?.total_non_applicable_aircraft ?? 0} />
                  <CompactStat label="Pend. config." value={summary?.pending_configuration_count ?? 0} tone="warning" />
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Seguimiento de cumplimiento
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Señales operativas para priorizar acciones de control y ejecución.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-sky-700" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                          Estado conectado
                        </p>
                        <p className="mt-1 text-xs leading-5 text-foreground/75">
                          Aplicabilidad, control y ejecuciones vinculadas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <CompactStat label="Abiertos" value={summary?.total_open_controls ?? 0} tone="warning" />
                  <CompactStat label="Cerrados" value={summary?.total_closed_controls ?? 0} tone="success" />
                  <CompactStat label="Recurrentes" value={summary?.total_recurrent_controls ?? 0} />
                  <CompactStat
                    label="Próx. / Venc."
                    value={`${summary?.upcoming_due_count ?? 0} / ${summary?.overdue_count ?? 0}`}
                    tone="danger"
                  />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <Tabs defaultValue="applicability" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-3xl border bg-muted/30 p-2">
            <TabsTrigger
              value="applicability"
              className="rounded-2xl px-4 py-2 text-[11px] uppercase tracking-[0.18em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Aplicabilidad
            </TabsTrigger>
            <TabsTrigger
              value="control"
              className="rounded-2xl px-4 py-2 text-[11px] uppercase tracking-[0.18em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Control
            </TabsTrigger>
            <TabsTrigger
              value="executions"
              className="rounded-2xl px-4 py-2 text-[11px] uppercase tracking-[0.18em] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Ejecuciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applicability" className="space-y-4">
            <SectionCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Aplicabilidad por aeronave
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vista compacta del estado de evaluación y motivo registrado.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TabSummaryPill label="Evaluadas" value={summary?.total_aircraft_evaluated ?? 0} />
                    <TabSummaryPill label="Aplicables" value={summary?.total_applicable_aircraft ?? 0} tone="success" />
                    <TabSummaryPill
                      label="Pend. config."
                      value={summary?.pending_configuration_count ?? 0}
                      tone="warning"
                    />
                  </div>
                </div>

                <Button size="sm" onClick={openCreateApplicability}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva aplicabilidad
                </Button>
              </div>
            </SectionCard>

            <CreateAirworthinessDirectiveApplicabilityDialog
              directiveId={directiveId}
              existingAircraftIds={existingAircraftIds}
              applicability={applicabilityToEdit}
              open={isCreateApplicabilityOpen}
              onOpenChange={closeApplicabilityDialog}
            />

            {isApplicabilitiesLoading ? (
              <LoadingPage />
            ) : applicabilities.length === 0 ? (
              <EmptyTab
                title="Sin aplicabilidades"
                description="Esta directiva todavía no tiene aeronaves evaluadas en aplicabilidad."
              />
            ) : (
              <div className="space-y-3">
                {applicabilities.map((item) => (
                  <SectionCard key={item.id} className="transition-colors hover:bg-muted/20">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold">{item.aircraft?.acronym ?? `#${item.aircraft_id}`}</p>
                          {item.is_applicable ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            >
                              Aplica
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-700">
                              No aplica
                            </Badge>
                          )}
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                          <InlineMetric
                            label="Aeronave"
                            value={item.aircraft?.aircraft_type?.full_name ?? item.aircraft?.model ?? 'Sin modelo'}
                          />
                          <InlineMetric
                            label={item.is_applicable ? 'Observación' : 'Motivo'}
                            value={item.non_applicability_reason || 'Sin observaciones registradas.'}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 xl:pl-4">
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
                      </div>
                    </div>
                  </SectionCard>
                ))}
              </div>
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

          <TabsContent value="control" className="space-y-4">
            {isControlsLoading ? (
              <LoadingPage />
            ) : (
              <>
                <SectionCard>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Controles de cumplimiento
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Controles activos y recurrentes con foco en vencimiento, recurrencia y estado.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TabSummaryPill label="Abiertos" value={summary?.total_open_controls ?? 0} tone="warning" />
                        <TabSummaryPill label="Cerrados" value={summary?.total_closed_controls ?? 0} tone="success" />
                        <TabSummaryPill label="Vencidas" value={summary?.overdue_count ?? 0} tone="danger" />
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-3xl border border-border/70 bg-muted/20 p-3 lg:grid-cols-[minmax(0,1.2fr)_220px_auto]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={controlSearchInput}
                          onChange={(event) => {
                            setControlSearchInput(event.target.value);
                            setControlPage(1);
                          }}
                          placeholder="Buscar por descripción, estado o urgencia"
                          className="border-background bg-background pl-10"
                        />
                      </div>

                      <Select
                        value={controlSort}
                        onValueChange={(value) => {
                          setControlSort(value as 'newest' | 'oldest');
                          setControlPage(1);
                        }}
                      >
                        <SelectTrigger className="border-background bg-background">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oldest">Vence primero</SelectItem>
                          <SelectItem value="newest">Vence después</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap justify-end gap-2">
                        {hasControlFilters ? (
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
                        ) : null}
                        <Button size="sm" onClick={() => openControlDialog()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo control
                        </Button>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {controls.length === 0 ? (
                  <EmptyTab
                    title="Sin controles"
                    description="Esta directiva todavía no tiene controles de cumplimiento registrados."
                  />
                ) : (
                  <div className="space-y-3">
                    {controls.map((control) => (
                      <SectionCard key={control.id} className="transition-colors hover:bg-muted/20">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <p className="text-base font-semibold">
                                  {control.description || (
                                    <span className="text-muted-foreground">Sin descripción</span>
                                  )}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Control #{control.id} con seguimiento por calendario, horas y ciclos.
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="outline"
                                  className={getComplianceStatusBadgeClass(control.compliance_status)}
                                >
                                  {control.compliance_status}
                                </Badge>
                                {control.urgency ? (
                                  <Badge variant="outline" className={getUrgencyBadgeClass(control.urgency)}>
                                    {control.urgency}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-500/30 bg-slate-500/10 text-slate-700"
                                  >
                                    Sin urgencia
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                              <InlineMetric label="Vence" value={formatDate(control.calendar_due_date ?? null)} />
                              <InlineMetric label="FH" value={control.flight_hours_due ?? '—'} />
                              <InlineMetric label="FC" value={control.cycles_due ?? '—'} />
                              <InlineMetric label="Rec. días" value={control.recurrence_interval_days ?? '—'} />
                              <InlineMetric label="Rec. horas" value={control.recurrence_interval_hours ?? '—'} />
                              <InlineMetric label="Rec. ciclos" value={control.recurrence_interval_cycles ?? '—'} />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1 xl:pl-4">
                            <Button variant="ghost" size="icon" onClick={() => openControlDialog(control)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar control</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openExecutionDialog(control)}
                              disabled={applicableAircraft.length === 0}
                            >
                              <CheckCheck className="h-4 w-4" />
                              <span className="sr-only">Registrar cumplimiento</span>
                            </Button>
                          </div>
                        </div>
                      </SectionCard>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
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

                <CreateAirworthinessDirectiveComplianceControlDialog
                  directiveId={directiveId}
                  control={controlToEdit}
                  open={isControlDialogOpen}
                  onOpenChange={closeControlDialog}
                />

                {executionControl && (
                  <CreateAirworthinessDirectiveComplianceExecutionDialog
                    directiveId={directiveId}
                    applicabilities={applicabilities}
                    control={executionControl}
                    open={isExecutionDialogOpen}
                    onOpenChange={closeExecutionDialog}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            {isRecordsLoading ? (
              <LoadingPage />
            ) : (
              <div className="space-y-4">
                <SectionCard>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Ejecuciones registradas
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Historial operativo por aeronave, OT e inspector.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <TabSummaryPill label="Registros" value={records.length} />
                        <TabSummaryPill label="Aeronaves" value={executionAircraftOptions.length || '—'} tone="info" />
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-3xl border border-border/70 bg-muted/20 p-3 lg:grid-cols-[minmax(0,1.25fr)_220px_220px_auto]">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={executionSearchInput}
                          onChange={(event) => {
                            setExecutionSearchInput(event.target.value);
                            setExecutionPage(1);
                          }}
                          placeholder="Buscar por OT, inspector, aeronave u observación"
                          className="border-background bg-background pl-10"
                        />
                      </div>

                      <Select
                        value={executionAircraftFilter}
                        onValueChange={(value) => {
                          setExecutionAircraftFilter(value);
                          setExecutionPage(1);
                        }}
                      >
                        <SelectTrigger className="border-background bg-background">
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
                        <SelectTrigger className="border-background bg-background">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Fecha más reciente</SelectItem>
                          <SelectItem value="oldest">Fecha más antigua</SelectItem>
                          <SelectItem value="aircraft">Aeronave</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex justify-end">
                        {hasExecutionFilters ? (
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
                        ) : null}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {records.length === 0 ? (
                  <EmptyTab
                    title="Sin coincidencias"
                    description="No hay ejecuciones que coincidan con los filtros actuales."
                  />
                ) : (
                  <div className="space-y-3">
                    {records.map((item) => (
                      <SectionCard key={item.id} className="transition-colors hover:bg-muted/20">
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold">
                                  {item.aircraft?.acronym ?? `#${item.aircraft_id}`}
                                </p>
                                <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-700">
                                  OT {item.work_order_number}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {item.remarks || 'Sin observación registrada para esta ejecución.'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-muted/20 px-3 py-2 text-sm font-medium text-foreground">
                              {formatDate(item.execution_date)}
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                            <InlineMetric label="Fecha" value={formatDate(item.execution_date)} />
                            <InlineMetric label="FH" value={item.flight_hours_at_execution ?? '—'} />
                            <InlineMetric label="FC" value={item.cycles_at_execution ?? '—'} />
                            <InlineMetric label="Inspector" value={item.inspector_license_signature} />
                          </div>
                        </div>
                      </SectionCard>
                    ))}
                  </div>
                )}

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
