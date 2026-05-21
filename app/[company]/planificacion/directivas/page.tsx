'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetAirworthinessDirectives } from '@/hooks/planificacion/directivas/queries';
import { formatDate } from '@/lib/helpers/format';
import { useCompanyStore } from '@/stores/CompanyStore';
import { FileBadge, FileText, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function AirworthinessDirectivesPage() {
  const { selectedCompany } = useCompanyStore();
  const { data: directivesResponse, isLoading, isError } = useGetAirworthinessDirectives();
  const [query, setQuery] = useState('');
  const directives = useMemo(() => directivesResponse?.data ?? [], [directivesResponse?.data]);
  const totalDirectives = directivesResponse?.meta?.total ?? directives.length;

  const filteredDirectives = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return directives;

    return directives.filter((directive) => {
      return [directive.ad_number, directive.authority, directive.subject_description]
        .some((field) => field?.toLowerCase().includes(normalizedQuery));
    });
  }, [directives, query]);

  const summary = useMemo(() => {
    return directives.reduce(
      (accumulator, directive) => {
        accumulator.recurring += Number(directive.is_recurring);
        accumulator.withPdf += Number(directive.summary?.has_pdf_document ?? Boolean(directive.pdf_document));
        accumulator.openControls += directive.summary?.open_controls_count ?? 0;
        accumulator.upcoming += directive.summary?.upcoming_count ?? 0;
        accumulator.overdue += directive.summary?.overdue_count ?? 0;
        return accumulator;
      },
      { recurring: 0, withPdf: 0, openControls: 0, upcoming: 0, overdue: 0 },
    );
  }, [directives]);

  if (isLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Directivas de Aeronavegabilidad">
      <div className="space-y-6 py-4">
        <section className="overflow-hidden rounded-2xl border bg-background">
          <div className="border-b bg-muted/20 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileBadge className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Planificación</span>
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Directivas de Aeronavegabilidad
                  </h1>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    Índice maestro de ADs con señales operativas por aeronave, control y cumplimiento.
                  </p>
                </div>
              </div>

              <Button size="sm" className="gap-2 self-start" asChild>
                <Link href={`/${selectedCompany?.slug}/planificacion/directivas/nueva`}>
                  <Plus className="h-4 w-4" />
                  Nueva directiva
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-b border-sky-200 bg-sky-50 px-5 py-4 dark:border-sky-900/40 dark:bg-sky-950/20 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-sky-200 bg-background text-sky-600 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                    Contexto operativo
                  </p>
                  <p className="text-sm text-sky-900/80 dark:text-sky-100/80">
                    Lectura rápida del estado documental, controles abiertos y vigencia de las directivas.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-sky-200 bg-background text-sky-700 dark:border-sky-900/40 dark:text-sky-200">
                  {totalDirectives} registros
                </Badge>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {summary.upcoming} próximas
                </Badge>
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300">
                  {summary.overdue} vencidas
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-background px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Total ADs</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <p className="text-2xl font-semibold text-foreground">{totalDirectives}</p>
                <p className="text-xs text-muted-foreground truncate">en índice</p>
              </div>
            </div>
            <div className="bg-background px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Recurrentes</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <p className="text-2xl font-semibold text-foreground">{summary.recurring}</p>
                <p className="text-xs text-muted-foreground truncate">con seguimiento</p>
              </div>
            </div>
            <div className="bg-background px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Con PDF</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <p className="text-2xl font-semibold text-foreground">{summary.withPdf}</p>
                <p className="text-xs text-muted-foreground truncate">listas</p>
              </div>
            </div>
            <div className="bg-background px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Controles abiertos</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <p className="text-2xl font-semibold text-foreground">{summary.openControls}</p>
                <p className="text-xs text-muted-foreground truncate">tareas activas</p>
              </div>
            </div>
          </div>
        </section>

        {isError ? (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/5">
            <FileText className="size-4" />
            <AlertDescription>No se pudieron cargar las directivas. Intenta recargar la página.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-background p-4 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Explorar</p>
                  <div className="relative w-full max-w-xl">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar por AD, autoridad o asunto"
                      className="h-11 border-border/70 bg-background pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="border-border/70 bg-muted/30 text-foreground">
                    {filteredDirectives.length} visibles
                  </Badge>
                  <span>
                    de {totalDirectives} directiva{totalDirectives !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-background">
              <div className="grid grid-cols-[1.55fr_0.8fr_0.8fr_0.8fr_0.75fr_1fr_0.8fr] gap-0 border-b bg-muted/20 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                <span>Directiva</span>
                <span>Autoridad</span>
                <span>Emisión</span>
                <span>Vigencia</span>
                <span>Apl.</span>
                <span>Control</span>
                <span className="text-right">Documento</span>
              </div>

              {filteredDirectives.length === 0 ? (
                <div className="grid min-h-[240px] place-items-center px-5 py-20 text-center text-sm text-muted-foreground">
                  <div className="space-y-3">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-muted-foreground">
                      <FileText className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-medium text-foreground">No hay directivas conectadas todavía.</p>
                      <p>No hay registros para el filtro actual.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDirectives.map((directive) => (
                    <Link
                      key={directive.id}
                      href={`/${selectedCompany?.slug}/planificacion/directivas/${directive.id}`}
                      className="grid grid-cols-[1.55fr_0.8fr_0.8fr_0.8fr_0.75fr_1fr_0.8fr] items-center gap-0 px-5 py-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="space-y-1.5 pr-4">
                        <p className="font-mono text-sm font-semibold text-foreground">{directive.ad_number}</p>
                        <p className="text-sm text-foreground/80 line-clamp-2">{directive.subject_description}</p>
                      </div>
                      <div className="text-sm font-medium text-foreground">{directive.authority}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(directive.issue_date)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(directive.effective_date)}</div>
                      <div className="text-sm font-medium text-foreground">
                        {directive.summary?.applicable_aircraft_count ?? '—'}
                      </div>
                      <div className="space-y-1 text-sm text-foreground">
                        <p className="font-medium">{directive.summary?.open_controls_count ?? 0} abiertos</p>
                        <p className="text-xs text-muted-foreground">
                          {directive.summary?.aggregated_status ?? (directive.is_recurring ? 'Recurrente' : 'Única')}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        {(directive.summary?.has_pdf_document ?? Boolean(directive.pdf_document)) ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          >
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sin PDF</Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
