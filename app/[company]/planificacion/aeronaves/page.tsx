'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { MaintenanceAircraft } from '@/types';
import { AlertCircle, Clock, MapPin, Plane, PlusCircle, RotateCcw, Search, SquareArrowOutUpRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const normalize = (v?: string | null) => (v ?? '').toLowerCase();

const AircraftsPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { data: aircrafts, isLoading, isError } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const [query, setQuery] = useState<string>('');

  const filteredAircrafts = useMemo<MaintenanceAircraft[]>(() => {
    if (!aircrafts) return [];

    let filtered = aircrafts;

    // Filtro de búsqueda por texto
    const q = normalize(query);
    if (q) {
      filtered = filtered.filter(
        (a: MaintenanceAircraft) =>
          normalize(a.acronym).includes(q) ||
          normalize(a.manufacturer?.name).includes(q) ||
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
      {/* Header operacional */}
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
                {query
                  ? `Sin resultados para "${query}"`
                  : 'No hay aeronaves registradas'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAircrafts.map((a) => (
                <Card
                  key={a.id}
                  className="group transition-all duration-150 hover:border-foreground/20 hover:shadow-sm overflow-hidden relative mx-auto w-full max-w-sm pt-0"
                >
                  <div className="absolute inset-0 z-30 aspect-video" />
                  <img
                    src="https://cdn.zbordirect.com/images/airlines/ES.webp"
                    alt="Event cover"
                    className="relative z-20 aspect-video w-full object-cover brightness-60 dark:brightness-40"
                  />
                  {/* Placa de matrícula */}
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 space-y-0">
                    <div className="flex items-center gap-2.5">
                      <Plane className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                      <span className="font-mono text-lg font-semibold tracking-widest leading-none">{a.acronym}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px]">
                      {a.manufacturer?.name ?? '—'}
                    </span>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
                    <Separator />

                    {/* Tipo */}
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Tipo</span>
                      <div className="text-right">
                        {a.aircraft_type?.full_name ? (
                          <span className="font-medium truncate">{a.aircraft_type.full_name}</span>
                        ) : (
                          <Badge variant="warning" className="text-xs">
                            Sin definir
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Serial */}
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Serial</span>
                      <span className="font-mono text-xs font-medium text-right">{a.serial || '—'}</span>
                    </div>

                    {/* Ubicación */}
                    {(a.location?.name || a.location?.address) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{a.location?.name ?? a.location?.address}</span>
                      </div>
                    )}

                    {/* Telemetría */}
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        <span className="font-medium tabular-nums text-foreground">
                          {a.flight_hours?.toLocaleString?.() ?? a.flight_hours ?? '—'}
                        </span>
                        <span>h</span>
                      </div>
                      <span className="text-border">·</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RotateCcw className="size-3 shrink-0" />
                        <span className="font-medium tabular-nums text-foreground">
                          {a.flight_cycles?.toLocaleString?.() ?? a.flight_cycles ?? '—'}
                        </span>
                        <span>ciclos</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full" variant={'outline'}>
                      <Link href={`/${selectedCompany?.slug}/planificacion/aeronaves/${a.acronym}`}>
                        <SquareArrowOutUpRight size={14} />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </ContentLayout>
  );
};

export default AircraftsPage;
