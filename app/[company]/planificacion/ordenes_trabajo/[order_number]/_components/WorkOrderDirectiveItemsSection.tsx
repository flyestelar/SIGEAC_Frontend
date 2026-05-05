'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WorkOrderDirectiveItemResource } from '@api/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, Calendar, FileText, RefreshCw, ShieldCheck } from 'lucide-react';

interface WorkOrderDirectiveItemsSectionProps {
  items: WorkOrderDirectiveItemResource[];
}

export function WorkOrderDirectiveItemsSection({ items }: WorkOrderDirectiveItemsSectionProps) {
  const count = items.length;

  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Directivas de Aeronavegabilidad
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {count} directiva{count !== 1 ? 's' : ''} asociada{count !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[11px] tabular-nums">
          <ShieldCheck className="size-2.5" />
          {count}
        </Badge>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-muted-foreground">
          <ShieldCheck className="size-7 opacity-20" />
          <p className="text-sm">No hay directivas de aeronavegabilidad asociadas a esta orden.</p>
        </div>
      ) : (
        <div className="divide-y">
          {items.map((directiveItem) => {
            const directive = directiveItem.directive;

            return (
              <div key={directiveItem.id} className="flex items-start gap-3 px-5 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-violet-500/20 bg-violet-500/10">
                  <ShieldCheck className="size-3.5 text-violet-600 dark:text-violet-400" />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {directive?.ad_number ?? `AD #${directiveItem.airworthiness_directive_id}`}
                        </span>
                        {directive?.authority && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-muted-foreground">
                            {directive.authority}
                          </Badge>
                        )}
                        {directive?.is_recurring && (
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-600 dark:text-amber-400"
                          >
                            <RefreshCw className="mr-1 size-2.5" />
                            Recurrente
                          </Badge>
                        )}
                        {directive?.pdf_document_url && (
                          <Badge
                            variant="outline"
                            className="h-4 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] text-sky-600 dark:text-sky-400"
                          >
                            <FileText className="mr-1 size-2.5" />
                            PDF
                          </Badge>
                        )}
                      </div>
                      {directive?.subject_description && (
                        <p className="mt-1 text-sm text-foreground/80 leading-snug">
                          {directive.subject_description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {directive?.effective_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        Vigente: {format(new Date(directive.effective_date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    )}
                    {directive?.summary && (
                      <>
                        {directive.effective_date && <span className="text-border">·</span>}
                        <span
                          className={cn(
                            'flex items-center gap-1',
                            directive.summary.open_controls_count > 0
                              ? 'font-semibold text-amber-600 dark:text-amber-400'
                              : '',
                          )}
                        >
                          {directive.summary.open_controls_count > 0 ? (
                            <AlertCircle className="size-3" />
                          ) : (
                            <ShieldCheck className="size-3" />
                          )}
                          {directive.summary.open_controls_count > 0
                            ? `${directive.summary.open_controls_count} control${directive.summary.open_controls_count !== 1 ? 'es' : ''} abierto${directive.summary.open_controls_count !== 1 ? 's' : ''}`
                            : 'Sin controles abiertos'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
