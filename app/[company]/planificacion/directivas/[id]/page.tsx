'use client';

import CreateAirworthinessDirectiveApplicabilityDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveApplicabilityDialog';
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
import { AlertCircle, ArrowLeft, FileBadge2, FileText, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode, useMemo, useState } from 'react';
import type { AirworthinessDirectiveApplicabilityResource } from '@api/types';

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
  const summary = directive?.summary;
  const [isCreateApplicabilityOpen, setIsCreateApplicabilityOpen] = useState(false);
  const [applicabilityToEdit, setApplicabilityToEdit] = useState<AirworthinessDirectiveApplicabilityResource | undefined>();
  const [applicabilityToDelete, setApplicabilityToDelete] = useState<AirworthinessDirectiveApplicabilityResource | undefined>();
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
            ) : (
              <TabTable
                headers={['Aeronave', 'Vence', 'FH', 'FC', 'Estado', 'Urgencia']}
                rows={controls.map((item) => [
                  <div key={`${item.id}-aircraft`}>
                    <p className="font-medium">{item.aircraft?.acronym ?? `#${item.aircraft_id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.aircraft?.aircraft_type?.full_name ?? item.aircraft?.model ?? 'Sin modelo'}
                    </p>
                  </div>,
                  formatDate(item.calendar_due_date),
                  item.flight_hours_due ?? '—',
                  item.cycles_due ?? '—',
                  item.compliance_status,
                  item.urgency ?? '—',
                ])}
                emptyTitle="Sin controles"
                emptyDescription="No hay controles de cumplimiento registrados para esta directiva."
              />
            )}
          </TabsContent>

          <TabsContent value="executions">
            {isRecordsLoading ? (
              <LoadingPage />
            ) : (
              <TabTable
                headers={['Aeronave', 'OT', 'Fecha', 'FH', 'FC', 'Inspector']}
                rows={records.map((item) => [
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
                emptyTitle="Sin ejecuciones"
                emptyDescription="No hay historial de cumplimiento para esta directiva todavía."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  );
}
