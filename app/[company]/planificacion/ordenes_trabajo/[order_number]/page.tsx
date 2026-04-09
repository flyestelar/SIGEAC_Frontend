/* eslint-disable @next/next/no-img-element */
'use client';

import { CompleteTaskDialog } from '@/components/dialogs/mantenimiento/ordenes_trabajo/CompleteTaskDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { workOrdersShowOptions } from '@api/queries';
import { WorkOrderItemResource, WorkOrderItemTaskResource, WorkOrderResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  Download,
  Layers,
  MessageSquareText,
  Plane,
  Printer,
  RotateCcw,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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

/* ─── Page ─── */

const WorkOrderPage = () => {
  const { order_number } = useParams<{ order_number: string }>();
  const { selectedCompany } = useCompanyStore();

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    ...workOrdersShowOptions({ path: { orderNumber: order_number } }),
  });

  const wo: WorkOrderResource | undefined = response?.data;

  const handleDownloadPdf = async () => {
    try {
      const res = await axiosInstance.get(`/${selectedCompany?.slug}/work-order-pdf/${order_number}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WO-${order_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el PDF.');
    }
  };

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

  const statusRaw = wo.status?.toUpperCase() ?? '';
  const statusCfg = STATUS_CONFIG[statusRaw] ?? fallbackStatus;
  const aircraft = wo.aircraft;
  const items = wo.items ?? [];
  const totalTasks = items.reduce((sum, item) => sum + (item.tasks?.length ?? 0), 0);

  return (
    <ContentLayout title="Orden de Trabajo">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleDownloadPdf}>
            <Download className="size-3.5" />
            PDF
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-8 min-w-0">
            {/* Aircraft card */}
            {aircraft && (
              <section className="overflow-hidden rounded-lg border bg-background">
                <div className="flex items-stretch">
                  <div className="relative w-56 shrink-0">
                    <img
                      src={aircraft.aircraft_type?.image || 'https://cdn.zbordirect.com/images/airlines/ES.webp'}
                      alt={aircraft.acronym}
                      className="h-full w-full object-cover brightness-[0.55] dark:brightness-[0.35]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="font-mono text-lg font-bold tracking-widest text-white drop-shadow-sm">
                          {aircraft.acronym}
                        </span>
                        {aircraft.aircraft_type?.full_name && (
                          <p className="text-[11px] text-white/70">{aircraft.aircraft_type.full_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="grid grid-cols-4 gap-x-4 px-4 py-2.5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Tipo
                        </p>
                        <p className="text-sm font-medium line-clamp-1">{aircraft.aircraft_type?.full_name ?? '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Fabricante
                        </p>
                        <p className="text-sm font-medium line-clamp-1">{aircraft.manufacturer?.name ?? '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Serial
                        </p>
                        <p className="font-mono text-sm font-medium">{aircraft.serial || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Modelo
                        </p>
                        <p className="text-sm font-medium">{aircraft.model || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-t bg-muted/20 px-4 py-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="size-3 shrink-0" />
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {aircraft.flight_hours?.toLocaleString?.() ?? '—'}
                        </span>
                        <span>h</span>
                      </div>
                      <div className="h-3 w-px bg-border" />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RotateCcw className="size-3 shrink-0" />
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {aircraft.flight_cycles?.toLocaleString?.() ?? '—'}
                        </span>
                        <span>ciclos</span>
                      </div>
                      <div className="ml-auto">
                        <Link href={`/${selectedCompany?.slug}/planificacion/aeronaves/${aircraft.acronym}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <Plane className="size-3" />
                            Ver aeronave
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Order info — compact grid, no header bar */}
            <section className="overflow-hidden rounded-lg border bg-background">
              <div className="grid grid-cols-4 gap-x-4 px-5 py-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Entrada</p>
                    <p className="text-sm font-medium">{formatDate(wo.entry_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Salida</p>
                    <p className="text-sm font-medium">{formatDate(wo.exit_date)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tally</p>
                  <p className="font-mono text-sm font-medium">{wo.tally_number || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={cn('text-[11px]', statusCfg.className)}>
                    {statusCfg.label}
                  </Badge>
                </div>
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
                        {aircraft.manufacturer?.name ?? 'Sin fabricante'} · S/N {aircraft.serial ?? '—'}
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
                <Button variant="outline" className="w-full gap-2" onClick={handleDownloadPdf}>
                  <Printer className="size-3.5" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
          <div className="ml-10 mr-5 overflow-hidden rounded-md border">
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

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0 cursor-pointer text-[10px] transition-colors hover:opacity-80',
                      taskStatusCfg.className,
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info('Cambiar estado (próximamente)');
                    }}
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
