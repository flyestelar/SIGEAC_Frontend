'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetHardTimeIntervalCompliances } from '@/hooks/planificacion/hard_time/useGetHardTimeIntervalCompliances';
import { formatDate, formatNumber } from '@/lib/helpers/format';
import { HardTimeIntervalResource } from '@api/types';
import { AlertCircle, ChevronDown, ClipboardCheck, Loader2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

type ComplianceHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interval: HardTimeIntervalResource | null;
  intervalId: number | null;
};

export function ComplianceHistoryDialog({ open, onOpenChange, interval, intervalId }: ComplianceHistoryDialogProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!open) {
      setStartDate('');
      setEndDate('');
    }
  }, [open]);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetHardTimeIntervalCompliances(open ? intervalId : null, {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });

  const compliances = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta?.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-muted-foreground" />
            Historial de cumplimientos
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {interval?.task_description ?? 'Intervalo'}
          </DialogDescription>
        </DialogHeader>

        {/* Date filters */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-3">
          <div className="flex-1 min-w-[130px] space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Desde
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[130px] space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Hasta
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-muted-foreground"
              onClick={() => { setStartDate(''); setEndDate(''); }}
            >
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <RotateCcw className="size-3" />
          {isLoading
            ? 'Cargando...'
            : `${total} registro${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 text-center">
            <AlertCircle className="size-4 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Error al cargar historial</p>
            <p className="text-xs text-muted-foreground">Intenta cerrar y volver a abrir el diálogo.</p>
          </div>
        ) : compliances.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 text-center">
            <ClipboardCheck className="size-4 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Sin registros</p>
            <p className="text-xs text-muted-foreground">Este intervalo no tiene cumplimientos para el período seleccionado.</p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto">
            <div className="space-y-2 pr-1">
              {compliances.map((compliance, index) => (
                <div
                  key={compliance.id}
                  className="rounded-lg border border-border/60 bg-background px-4 py-3 space-y-3"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-[10px] font-semibold text-muted-foreground">
                        {total - index}
                      </div>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatDate(compliance.compliance_date)}
                      </span>
                    </div>
                    {compliance.work_order && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-md border-border/60 bg-muted/20 px-2 font-mono text-[11px]">
                        WO {compliance.work_order.order_number}
                      </Badge>
                    )}
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">FH aeronave</p>
                      <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                        {formatNumber(compliance.aircraft_hours_at_compliance, 2)}
                        <span className="ml-1 text-[10px] text-muted-foreground">h</span>
                      </p>
                    </div>
                    <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">FC aeronave</p>
                      <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                        {formatNumber(compliance.aircraft_cycles_at_compliance, 0)}
                        <span className="ml-1 text-[10px] text-muted-foreground">cyc</span>
                      </p>
                    </div>
                    {compliance.next_due_hours != null && (
                      <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Próx. FH</p>
                        <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                          {formatNumber(compliance.next_due_hours, 2)}
                          <span className="ml-1 text-[10px] text-muted-foreground">h</span>
                        </p>
                      </div>
                    )}
                    {compliance.next_due_cycles != null && (
                      <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Próx. FC</p>
                        <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                          {formatNumber(compliance.next_due_cycles, 0)}
                          <span className="ml-1 text-[10px] text-muted-foreground">cyc</span>
                        </p>
                      </div>
                    )}
                    {compliance.next_due_date != null && (
                      <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Próx. fecha</p>
                        <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
                          {formatDate(compliance.next_due_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  {compliance.remarks && (
                    <p className="rounded-md border border-border/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">Notas: </span>
                      {compliance.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                  {isFetchingNextPage ? 'Cargando...' : 'Mostrar más'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
