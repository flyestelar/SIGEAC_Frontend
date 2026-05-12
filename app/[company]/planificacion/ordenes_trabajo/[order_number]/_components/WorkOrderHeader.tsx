'use client';

import { DocumentDownloadButton } from '@/components/misc/DocumentDownloadButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkOrderDocuments } from '@/hooks/planificacion/useWorkOrderDocuments';
import { cn } from '@/lib/utils';
import { useCompanySlug } from '@/stores/CompanyStore';
import { WorkOrderResource } from '@api/types';
import { AlertCircleIcon, ArrowLeft, CheckCircle2, CheckCircle2Icon, ClipboardList, RotateCcwIcon } from 'lucide-react';
import Link from 'next/link';
import { getStatusConfig } from './constants';
import { timestampEqualSecondsPrecision } from './WorkOrderHelpers';

interface WorkOrderHeaderProps {
  order_number: string;
  wo: WorkOrderResource;
  onCompleteWorkOrder: () => void;
}

export function WorkOrderHeader({ order_number, wo, onCompleteWorkOrder }: WorkOrderHeaderProps) {
  const companySlug = useCompanySlug();

  const { workOrder, tallySheet, queueDocument, mutations } = useWorkOrderDocuments(order_number);

  const workOrderIsCompleted = workOrder.isCompleted;
  const workOrderIsFailed = workOrder.isFailed;

  const tallySheetIsCompleted = tallySheet.isCompleted;
  const tallySheetIsFailed = tallySheet.isFailed;

  const statusRaw = wo?.status?.toUpperCase() ?? '';
  const statusCfg = getStatusConfig(statusRaw);

  const workOrderStale = Boolean(
    workOrder.statusData?.work_order_updated_at &&
      wo.updated_at &&
      !timestampEqualSecondsPrecision(workOrder.statusData.work_order_updated_at, wo?.updated_at),
  );
  const tallySheetStale = Boolean(
    tallySheet.statusData?.work_order_updated_at &&
      wo.updated_at &&
      !timestampEqualSecondsPrecision(tallySheet.statusData.work_order_updated_at, wo?.updated_at),
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href={`/${companySlug}/planificacion/ordenes_trabajo`}>
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
            onClick={onCompleteWorkOrder}
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
              stale: workOrderStale,
              ...workOrder,
            },
            {
              label: 'Tally Sheet',
              type: 'tally_sheet' as const,
              stale: tallySheetStale,
              ...tallySheet,
            },
          ].map((doc) => {
            if (doc.isNotGenerated) return null;

            return (
              <div
                key={doc.label}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors',
                  doc.isGenerating && 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400',
                  doc.isCompleted &&
                    !doc.stale &&
                    'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
                  doc.isCompleted &&
                    doc.stale &&
                    'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  doc.isFailed && 'border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400',
                )}
              >
                {doc.isGenerating && <RotateCcwIcon className="size-4 animate-spin" />}
                {doc.isCompleted && <CheckCircle2Icon className="size-4" />}
                {doc.isFailed && <AlertCircleIcon className="size-4" />}
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-medium">{doc.label}</span>
                  <span>
                    {doc.isGenerating
                      ? 'Generando documento PDF...'
                      : doc.isCompleted
                        ? doc.stale
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
                    stale={doc.stale}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
