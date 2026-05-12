'use client';

import { CompleteTasksBulkDialog } from '@/components/dialogs/mantenimiento/ordenes_trabajo/CompleteTasksBulkDialog';
import { CompleteWorkOrderDialog } from '@/components/dialogs/mantenimiento/ordenes_trabajo/CompleteWorkOrderDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Accordion } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { workOrdersShowOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import { sumBy } from 'es-toolkit';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Layers,
  MessageSquareText,
  Plane,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AircraftSection } from './_components/AircraftSection';
import { ControlAccordionItem } from './_components/ControlAccordionItem';
import { SummaryField } from './_components/SummaryField';
import { WorkOrderComponentItemsSection } from './_components/WorkOrderComponentItemsSection';
import { WorkOrderDirectiveItemsSection } from './_components/WorkOrderDirectiveItemsSection';
import { WorkOrderHeader } from './_components/WorkOrderHeader';
import { formatDate } from './_components/WorkOrderHelpers';
import { getStatusConfig } from './_components/constants';

/* ─── Page ─── */

const WorkOrderPage = () => {
  const { order_number } = useParams<{ order_number: string }>();
  const [completeOrderOpen, setCompleteOrderOpen] = useState(false);
  const [bulkCompleteOpen, setBulkCompleteOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    ...workOrdersShowOptions({ path: { orderNumber: order_number } }),
  });

  const wo = response?.data;
  const statusRaw = wo?.status?.toUpperCase() ?? '';
  const statusCfg = getStatusConfig(statusRaw);
  const aircraft = wo?.aircraft;
  const items = wo?.items ?? [];
  const componentItems = wo?.component_items ?? [];
  const directiveItems = wo?.directive_items ?? [];
  const aircraftLocationLabel = aircraft?.location?.address ?? aircraft?.location?.cod_iata ?? '—';
  const totalTasks = sumBy(items, (item) => item.tasks?.length ?? 0);
  const pendingTasksCount = sumBy(items, (item) => (item.tasks ?? []).filter((task) => !task.review_by).length);

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

  return (
    <ContentLayout title="Orden de Trabajo">
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <WorkOrderHeader order_number={order_number} wo={wo} onCompleteWorkOrder={() => setCompleteOrderOpen(true)} />

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

            <WorkOrderComponentItemsSection items={componentItems} />

            <WorkOrderDirectiveItemsSection items={directiveItems} />
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

export default WorkOrderPage;
