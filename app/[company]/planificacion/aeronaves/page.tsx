'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AlertCircle, ArrowRight, Clock, MapPin, Plane, PlusCircle, RotateCcw, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const normalize = (v?: string | null) => (v ?? '').toLowerCase();

const AircraftsPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { data: aircrafts, isLoading, isError } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const [query, setQuery] = useState<string>('');

  const filteredAircrafts = useMemo(() => {
    if (!aircrafts) return [];

    let filtered = aircrafts;
    const q
      = normalize(query);
    if (q) {
      filtered = filtered.filter(
        (a) =>
          normalize(a.acronym).includes(q) ||
          normalize(a.serial).includes(q) ||
          normalize(a.aircraft_type?.full_name).includes(q),
      );
    }

    return filtered;
  }, [aircrafts, query]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <ContentLayout title="Aeronaves">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registro de Aeronaves</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredAircrafts.length} de {aircrafts?.length ?? 0} aeronave{filteredAircrafts.length !== 1 ? 's' : ''}{' '}
            mostrada{filteredAircrafts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mt-3 sm:mt-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Acrónimo, serial, modelo…"
              className="pl-9 h-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link href={`/${selectedCompany?.slug}/planificacion/aeronaves/ingreso_aeronave`}>
              <PlusCircle className="size-4" />
              Registrar aeronave
            </Link>
          </Button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>Error al cargar los datos. Intente recargar la página.</AlertDescription>
        </Alert>
      )}

      {/* Grid de aeronaves */}
      {!isError && (
        <>
          {filteredAircrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <Plane className="size-10 opacity-20" />
              <p className="text-sm">
                {query ? `Sin resultados para "${query}"` : 'No hay aeronaves registradas'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAircrafts.map((a) => (
                <Link
                  key={a.id}
                  href={`/${selectedCompany?.slug}/planificacion/aeronaves/${a.acronym}`}
                  className="group overflow-hidden rounded-lg border bg-background transition-colors duration-150 hover:border-sky-500/40"
                >
                  {/* Hero image with overlay registration badge */}
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/aircraft.webp"
                      alt={a.acronym}
                      className="aspect-[16/7] w-full object-cover brightness-[0.55] dark:brightness-[0.35] transition-all duration-300 group-hover:brightness-[0.8] dark:group-hover:brightness-[0.45] group-hover:scale-[1.02]"
                    />
                    {/* Gradient fade bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* Registration overlay */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded border border-white/20 bg-white/10 backdrop-blur-sm shrink-0">
                          <Plane className="size-3.5 text-white" />
                        </div>
                        <span className="font-mono text-lg font-bold tracking-widest text-white drop-shadow-sm">
                          {a.acronym}
                        </span>
                      </div>
                      <ArrowRight className="size-4 text-white/70 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0 mb-0.5" />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-4 py-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Tipo
                        </span>
                        <div className="text-sm">
                          {a.aircraft_type?.full_name ? (
                            <span className="font-medium leading-tight line-clamp-1">
                              {a.aircraft_type.full_name}
                            </span>
                          ) : (
                            <Badge variant="warning" className="text-xs">
                              Sin definir
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Fabricante
                        </span>
                        <p className="text-sm font-medium leading-tight line-clamp-1">
                          {a.aircraft_type?.manufacturer?.name ?? '—'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Serial
                        </span>
                        <p className="font-mono text-sm font-medium">{a.serial || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry footer */}
                  <div className="flex items-center gap-4 border-t bg-muted/20 px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {a.flight_hours?.toLocaleString?.() ?? a.flight_hours ?? '—'}
                      </span>
                      <span>h</span>
                    </div>
                    <div className="h-3 w-px bg-border" />
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RotateCcw className="size-3 shrink-0" />
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {a.flight_cycles?.toLocaleString?.() ?? a.flight_cycles ?? '—'}
                      </span>
                      <span>ciclos</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </ContentLayout>
  );
};

export default AircraftsPage;
