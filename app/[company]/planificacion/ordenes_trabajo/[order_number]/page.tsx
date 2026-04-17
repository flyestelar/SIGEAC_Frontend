'use client';

import { CompleteTaskDialog } from '@/components/dialogs/mantenimiento/ordenes_trabajo/CompleteTaskDialog';
import { CompleteTasksBulkDialog } from '@/components/dialogs/mantenimiento/ordenes_trabajo/CompleteTasksBulkDialog';
import { CompleteWorkOrderDialog } from '@/components/dialogs/mantenimiento/ordenes_trabajo/CompleteWorkOrderDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { DocumentDownloadButton } from '@/components/misc/DocumentDownloadButton';
import LoadingPage from '@/components/misc/LoadingPage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { workOrdersShowOptions } from '@api/queries';
import useWorkOrderDocuments from '@/hooks/planificacion/useWorkOrderDocuments';
import { WorkOrderItemResource, WorkOrderItemTaskResource, WorkOrderResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Layers,
  MessageSquareText,
  Plane,
  RotateCcw,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AircraftSection } from './_components/AircraftSection';

/* ─── Constants ─── */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  APROBADO: {
    label: 'Aprobado',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  ABIERTO: {
    label: 'Abierto',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  CERRADO: {
    label: 'Cerrado',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
  PENDIENTE: {
    label: 'Pendiente',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  RECHAZADO: {
    label: 'Rechazado',
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

const TASK_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  COMPLETADO: {
    label: 'Completado',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  CERRADO: {
    label: 'Cerrado',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  PENDIENTE: {
    label: 'Pendiente',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  ABIERTO: {
    label: 'Abierto',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
};

const fallbackStatus = { label: 'Sin estado', className: 'border-border bg-muted/20 text-muted-foreground' };

/* ─── Helpers ─── */

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    return format(parseLocalDate(dateStr), 'dd MMM yyyy', { locale: es });
  } catch {
    return '—';
  }
}

function SummaryField({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-h-14 bg-background px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={cn('mt-1 text-[13px] font-medium leading-tight text-foreground/90', mono && 'font-mono')}>
        {value}
      </div>
    </div>
  );
}

/* ─── Page ─── */

const WorkOrderPage = () => {
  const { order_number } = useParams<{ order_number: string }>();
  const { selectedCompany } = useCompanyStore();
  const [completeOrderOpen, setCompleteOrderOpen] = useState(false);
  const [bulkCompleteOpen, setBulkCompleteOpen] = useState(false);
  const { workOrder, tallySheet, queueDocument, mutations } = useWorkOrderDocuments(order_number);

  const workOrderIsCompleted = workOrder.isCompleted;
  const workOrderIsFailed = workOrder.isFailed;

  const tallySheetIsCompleted = tallySheet.isCompleted;
  const tallySheetIsFailed = tallySheet.isFailed;

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    ...workOrdersShowOptions({ path: { orderNumber: order_number } }),
  });

  const wo: WorkOrderResource | undefined = response?.data;
  const statusRaw = wo?.status?.toUpperCase() ?? '';
  const statusCfg = STATUS_CONFIG[statusRaw] ?? fallbackStatus;
  const aircraft = wo?.aircraft;
  const items = wo?.items ?? [];
  const aircraftLocationLabel = aircraft?.location?.address ?? aircraft?.location?.cod_iata ?? '—';
  const totalTasks = items.reduce((sum, item) => sum + (item.tasks?.length ?? 0), 0);
  const pendingTasksCount = items.reduce(
    (sum, item) => sum + (item.tasks ?? []).filter((task) => !task.review_by).length,
    0,
  );

  if (isLoading) return <LoadingPage />;

  if (isError || !wo) {
    return (
      <ContentLayout title="Orden de Trabajo">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>Error al cargar la orden de trabajo. Intente recargar la página.</AlertDescription>
        </Alert>
      </ContentLayout>
    );
  }

  const workOrderStale = Boolean(
    workOrder.statusData?.work_order_updated_at && workOrder.statusData.work_order_updated_at !== wo?.updated_at,
  );
  const tallySheetStale = Boolean(
    tallySheet.statusData?.work_order_updated_at && tallySheet.statusData.work_order_updated_at !== wo?.updated_at,
  );
  return (
    <ContentLayout title="Orden de Trabajo">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href={`/${selectedCompany?.slug}/planificacion/ordenes_trabajo`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                <ClipboardList className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono text-lg font-semibold tracking-wide">{wo.order_number}</h1>
                  <Badge variant="outline" className={cn('text-[11px]', statusCfg.className)}>
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {wo.tally_number ? `Tally: ${wo.tally_number}` : 'Orden de Trabajo'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 h-8 gap-1.5 text-xs"
              onClick={() => setCompleteOrderOpen(true)}
              disabled={statusRaw === 'CERRADO'}
            >
              <CheckCircle2 className="size-3.5" />
              {statusRaw === 'CERRADO' ? 'Orden completada' : 'Completar orden'}
            </Button>
            <DocumentDownloadButton
              type="work_order"
              orderNumber={order_number}
              isCompleted={workOrderIsCompleted}
              isFailed={workOrderIsFailed}
              isPending={mutations.workOrderQueue.status === 'pending'}
              onQueue={() => queueDocument('work_order')}
              disabled={mutations.workOrderQueue.status === 'pending'}
              stale={workOrderStale}
            />
            <DocumentDownloadButton
              type="tally_sheet"
              orderNumber={order_number}
              isCompleted={tallySheetIsCompleted}
              isFailed={tallySheetIsFailed}
              isPending={mutations.tallySheetQueue.status === 'pending'}
              onQueue={() => queueDocument('tally_sheet')}
              disabled={mutations.tallySheetQueue.status === 'pending'}
              stale={tallySheetStale}
            />
          </div>
        </div>

        {(!workOrder.isNotGenerated || !tallySheet.isNotGenerated) && (
          <div className="space-y-3">
            {[
              {
                label: 'Orden de Trabajo',
                type: 'work_order' as const,
                ...workOrder,
              },
              {
                label: 'Tally Sheet',
                type: 'tally_sheet' as const,
                ...tallySheet,
              },
            ].map((doc) => {
              if (doc.isNotGenerated) return null;

              const { statusData } = doc;
              const isStale = Boolean(
                statusData?.work_order_updated_at &&
                  wo.updated_at &&
                  !timestampEqualSecondsPrecision(statusData.work_order_updated_at, wo.updated_at),
              );
              return (
                <div
                  key={doc.label}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors',
                    doc.isGenerating && 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400',
                    doc.isCompleted &&
                      !isStale &&
                      'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
                    doc.isCompleted &&
                      isStale &&
                      'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    doc.isFailed && 'border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400',
                  )}
                >
                  {doc.isGenerating && <RotateCcw className="size-4 animate-spin" />}
                  {doc.isCompleted && <CheckCircle2 className="size-4" />}
                  {doc.isFailed && <AlertCircle className="size-4" />}
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-medium">{doc.label}</span>
                    <span>
                      {doc.isGenerating
                        ? 'Generando documento PDF...'
                        : doc.isCompleted
                          ? isStale
                            ? 'Documento PDF listo (desactualizado)'
                            : 'Documento PDF listo para descargar'
                          : doc.isFailed
                            ? 'Error al generar el documento PDF'
                            : 'Preparando generación...'}
                    </span>
                    {doc.statusError ? (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">{doc.statusError}</span>
                    ) : null}
                  </div>
                  {(doc.isCompleted || doc.isFailed) && (
                    <DocumentDownloadButton
                      type={doc.type}
                      orderNumber={order_number}
                      isCompleted={doc.isCompleted}
                      isFailed={doc.isFailed}
                      isPending={false}
                      onQueue={() => queueDocument(doc.type)}
                      disabled={false}
                      stale={isStale}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-8 min-w-0">
            {/* Aircraft card */}
            {aircraft && <AircraftSection aircraft={aircraft} />}

            {/* Order info */}
            <section className="overflow-hidden rounded-lg border bg-background">
              <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-5">
                <SummaryField label="Tally" value={wo.tally_number || '—'} mono />
                <SummaryField
                  label="Estado"
                  value={
                    <Badge variant="outline" className={cn('text-[11px]', statusCfg.className)}>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                <SummaryField label="Entrada" value={formatDate(wo.entry_date)} />
                <SummaryField label="Salida" value={formatDate(wo.exit_date)} />
                <SummaryField label="Realizado en" value={aircraftLocationLabel} />
              </div>
              {wo.remarks && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2 px-5 py-3">
                    <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-foreground/80">{wo.remarks}</p>
                  </div>
                </>
              )}
            </section>

            {/* Controls & Task Cards — Accordion in ScrollArea */}
            <section className="overflow-hidden rounded-lg border bg-background">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Controles de Mantenimiento
                  </span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {items.length} control{items.length !== 1 ? 'es' : ''} · {totalTasks} task card
                    {totalTasks !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px]"
                    onClick={() => setBulkCompleteOpen(true)}
                    disabled={pendingTasksCount === 0}
                  >
                    <Check className="size-3" />
                    Completar por lote
                  </Button>
                  <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
                    <Settings2 className="size-2.5" />
                    {items.length}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
                    <Layers className="size-2.5" />
                    {totalTasks}
                  </Badge>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-muted-foreground">
                  <Settings2 className="size-7 opacity-20" />
                  <p className="text-sm">No hay controles asociados a esta orden.</p>
                </div>
              ) : (
                <div className="max-h-[680px] overflow-y-auto">
                  <Accordion type="multiple" className="divide-y">
                    {items.map((item) => (
                      <ControlAccordionItem key={item.id} item={item} orderNumber={order_number} />
                    ))}
                  </Accordion>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-4 self-start">
            <div className="rounded-lg border bg-background">
              {/* Status — prominent */}
              <div
                className={cn(
                  'flex items-center justify-center gap-2 rounded-t-lg border-b px-4 py-3',
                  statusCfg.className,
                )}
              >
                <ShieldCheck className="size-4" />
                <span className="text-sm font-semibold">{statusCfg.label}</span>
              </div>

              <div className="space-y-4 p-4">
                {/* Aircraft mini card */}
                {aircraft && (
                  <div className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10">
                      <Plane className="size-3.5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold tracking-widest">{aircraft.acronym}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {aircraft.aircraft_type?.manufacturer?.name ?? 'Sin fabricante'} · S/N {aircraft.serial ?? '—'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dates — inline rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      Entrada
                    </span>
                    <span className="text-sm font-medium">{formatDate(wo.entry_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" />
                      Salida
                    </span>
                    <span className="text-sm font-medium">{formatDate(wo.exit_date)}</span>
                  </div>
                </div>

                <Separator />

                {/* Action */}
                <div className="space-y-2">
                  <Button
                    className="w-full gap-2"
                    onClick={() => setCompleteOrderOpen(true)}
                    disabled={statusRaw === 'CERRADO'}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {statusRaw === 'CERRADO' ? 'Orden completada' : 'Completar orden'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CompleteWorkOrderDialog
        open={completeOrderOpen}
        workOrder={wo}
        orderNumber={order_number}
        onOpenChange={setCompleteOrderOpen}
      />
      <CompleteTasksBulkDialog
        open={bulkCompleteOpen}
        items={items}
        orderNumber={order_number}
        onOpenChange={setBulkCompleteOpen}
      />
    </ContentLayout>
  );
};

/* ─── Control Accordion Item ─── */

function ControlAccordionItem({ item, orderNumber }: { item: WorkOrderItemResource; orderNumber: string }) {
  const control = item.maintenance_control;
  const tasks = item.tasks ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<WorkOrderItemTaskResource | null>(null);

  const openCompleteDialog = (task: WorkOrderItemTaskResource) => {
    setActiveTask(task);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveTask(null);
  };

  return (
    <AccordionItem value={`control-${item.id}`} className="border-none">
      <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-muted/10 [&[data-state=open]]:bg-muted/10">
        <div className="flex flex-1 items-center gap-3 text-left">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-muted/30">
            <Settings2 className="size-3 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {control?.title ?? `Control #${item.maintenance_control_id}`}
            </p>
            {control?.manual_reference && (
              <p className="font-mono text-[11px] text-muted-foreground">{control.manual_reference}</p>
            )}
          </div>
          <Badge variant="outline" className="mr-2 shrink-0 gap-1 text-[11px] tabular-nums">
            <Layers className="size-2.5" />
            {tasks.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-1 pt-0">
        {tasks.length === 0 ? (
          <p className="px-5 pb-3 ml-10 text-xs text-muted-foreground">Sin task cards.</p>
        ) : (
          <div className="ml-5 mr-5 overflow-hidden rounded-md border">
            {tasks.map((task, idx) => {
              const taskStatusRaw = (task.review_by ? 'COMPLETADO' : 'PENDIENTE').toUpperCase();
              const taskStatusCfg = TASK_STATUS_CONFIG[taskStatusRaw] ?? fallbackStatus;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/10',
                    idx !== 0 && 'border-t border-border/50',
                  )}
                >
                  <span className="w-5 shrink-0 text-center font-mono text-[11px] text-muted-foreground/50">
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{task.task?.description ?? `Task #${task.task_id}`}</p>
                    {(task.task?.old_task || task.task?.new_task) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {task.task?.old_task && <span>Old Task Card: {task.task.old_task}</span>}
                        {task.task?.new_task && <span>New Task Card: {task.task.new_task}</span>}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {task.inspection_date && <span>Inspección: {formatDate(task.inspection_date)}</span>}
                      {task.review_by && <span>Revisado por: {task.review_by}</span>}
                    </div>
                  </div>

                  {task.task?.manual_reference && (
                    <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
                      {task.task.manual_reference}
                    </span>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    {!task.review_by ? (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCompleteDialog(task);
                              }}
                            >
                              <Check className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Completar task</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 cursor-pointer text-[10px] transition-colors hover:opacity-80',
                      taskStatusCfg.className,
                    )}
                  >
                    {taskStatusCfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </AccordionContent>

      <CompleteTaskDialog
        open={dialogOpen}
        task={activeTask}
        orderNumber={orderNumber}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      />
    </AccordionItem>
  );
}

export default WorkOrderPage;

function timestampEqualSecondsPrecision(ts1: string, ts2: string) {
  const date1 = new Date(ts1);
  const date2 = new Date(ts2);
  return Math.floor(date1.getTime() / 1000) === Math.floor(date2.getTime() / 1000);
}
