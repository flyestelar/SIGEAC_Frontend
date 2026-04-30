'use client';

import CreateAirworthinessDirectiveDialog from '@/components/dialogs/planificacion/directivas/CreateAirworthinessDirectiveDialog';
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
        accumulator.upcoming += directive.summary?.upcoming_count ?? 0;
        accumulator.overdue += directive.summary?.overdue_count ?? 0;
        return accumulator;
      },
      { recurring: 0, withPdf: 0, upcoming: 0, overdue: 0 },
    );
  }, [directives]);

  if (isLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Directivas de Aeronavegabilidad">
      <div className="space-y-6 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileBadge className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Planificación</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Directivas de Aeronavegabilidad</h1>
              <p className="text-sm text-muted-foreground">
                Índice maestro de ADs con señales operativas por aeronave, control y cumplimiento.
              </p>
            </div>
          </div>

          <Button size="sm" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva directiva
          </Button>
        </div>

        <CreateAirworthinessDirectiveDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <Alert>
          <FileText className="size-4" />
          <AlertDescription>
            Índice conectado. El resumen operativo de cada AD se consume desde `summary` cuando viene en la respuesta.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Total ADs</p>
            <p className="mt-3 text-3xl font-semibold">{totalDirectives}</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recurrentes</p>
            <p className="mt-3 text-3xl font-semibold">{summary.recurring}</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Con PDF</p>
            <p className="mt-3 text-3xl font-semibold">{summary.withPdf}</p>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Próximas / Vencidas</p>
            <p className="mt-3 text-3xl font-semibold">{summary.upcoming} / {summary.overdue}</p>
          </div>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <FileText className="size-4" />
            <AlertDescription>No se pudieron cargar las directivas. Intenta recargar la página.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por AD, autoridad o asunto"
                  className="h-10 pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {filteredDirectives.length} de {totalDirectives} directiva{totalDirectives !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border bg-background">
              <div className="grid grid-cols-[1.55fr_0.8fr_0.8fr_0.8fr_0.75fr_1fr_0.8fr] gap-0 border-b bg-muted px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span>Directiva</span>
                <span>Autoridad</span>
                <span>Emisión</span>
                <span>Vigencia</span>
                <span>Apl.</span>
                <span>Control</span>
                <span className="text-right">Documento</span>
              </div>

              {filteredDirectives.length === 0 ? (
                <div className="grid min-h-[240px] place-items-center px-4 py-20 text-center text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p>No hay directivas conectadas todavía.</p>
                    <p>No hay registros para el filtro actual.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDirectives.map((directive) => (
                    <Link
                      key={directive.id}
                      href={`/${selectedCompany?.slug}/planificacion/directivas/${directive.id}`}
                      className="grid grid-cols-[1.55fr_0.8fr_0.8fr_0.8fr_0.75fr_1fr_0.8fr] items-center gap-0 px-4 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1 pr-4">
                        <p className="font-medium">{directive.ad_number}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{directive.subject_description}</p>
                      </div>
                      <div className="text-sm text-foreground">{directive.authority}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(directive.issue_date)}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(directive.effective_date)}</div>
                      <div className="text-sm text-foreground">{directive.summary?.applicable_aircraft_count ?? '—'}</div>
                      <div className="space-y-1 text-sm text-foreground">
                        <p>{directive.summary?.open_controls_count ?? 0} abiertos</p>
                        <p className="text-xs text-muted-foreground">
                          {directive.summary?.aggregated_status ?? (directive.is_recurring ? 'Recurrente' : 'Única')}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        {(directive.summary?.has_pdf_document ?? Boolean(directive.pdf_document)) ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
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
