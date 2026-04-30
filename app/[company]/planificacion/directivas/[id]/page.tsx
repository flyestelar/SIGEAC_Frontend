'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useGetAirworthinessDirectiveApplicabilities,
  useGetAirworthinessDirectiveComplianceControls,
  useGetAirworthinessDirectiveComplianceRecords,
  useGetAirworthinessDirectiveDetail,
} from '@/hooks/planificacion/directivas/queries';
import { formatDate } from '@/lib/helpers/format';
import { useCompanyStore } from '@/stores/CompanyStore';
import {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
  AirworthinessDirectiveComplianceRecordResource,
  AirworthinessDirectiveResource,
} from '@api/types';
import { AlertCircle, ArrowLeft, FileBadge2, FileText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

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
  const directive: AirworthinessDirectiveResource | undefined = directiveResponse?.data;
  const applicabilities: AirworthinessDirectiveApplicabilityResource[] = applicabilitiesResponse?.data ?? [];
  const controls: AirworthinessDirectiveComplianceControlResource[] = controlsResponse?.data ?? [];
  const records: AirworthinessDirectiveComplianceRecordResource[] = recordsResponse?.data ?? [];
  const summary = directive?.summary;

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
            {isApplicabilitiesLoading ? (
              <LoadingPage />
            ) : (
              <TabTable
                headers={['Aeronave', 'Aplica', 'Motivo', 'AMOC']}
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
                ])}
                emptyTitle="Sin aplicabilidades"
                emptyDescription="Esta directiva todavía no tiene aeronaves evaluadas en aplicabilidad."
              />
            )}
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
