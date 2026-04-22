'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGetMaintenanceAircraftByAcronym } from '@/hooks/planificacion/useGetMaitenanceAircraftByAcronym';
import { useGetAircraftDailyAverage } from '@/hooks/planificacion/useGetAircraftDailyAverage';
import { AircraftDailyAverageCard } from '@/components/cards/planificacion/AircraftDailyAverageCard';
import { useCompanyStore } from '@/stores/CompanyStore';
import { SimpleEditAirplaneDialog } from '@/components/dialogs/planificacion/SimpleEditAirplaneDialog';
import {
  Calendar,
  Clock,
  Factory,
  FileText,
  MapPin,
  Plane,
  RotateCcw,
  User,
  Wrench,
  Pencil,
  ArrowLeft,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import LoadingPage from '@/components/misc/LoadingPage';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { HardTimeComponentsCard } from '@/components/cards/planificacion/HardTimeComponentsCard';
import { InstallationHistoryCard } from '@/components/cards/planificacion/InstallationHistoryCard';

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Stat mini-card ──────────────────────────────────────────────────────────
const Stat = ({
  icon: Icon,
  label,
  value,
  onEdit,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
}) => (
  <Card className="border-dashed">
    <CardHeader className="py-3 pb-1">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
        {onEdit && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            aria-label={`Editar ${label}`}
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="pb-3">
      <div className="text-xl font-semibold tabular-nums">{value ?? '—'}</div>
    </CardContent>
  </Card>
);

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AircraftDetailsPage() {
  const { acronym } = useParams<{ acronym: string }>();
  const decodedAcronym = decodeURIComponent(acronym);
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();
  const {
    data: aircraft,
    isLoading,
    isError,
  } = useGetMaintenanceAircraftByAcronym(decodedAcronym, selectedCompany?.slug);
  const { data: aircraftDailyAverage, isLoading: isDailyAverageLoading } = useGetAircraftDailyAverage(
    decodedAcronym,
    undefined,
    !!selectedCompany?.slug,
  );
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  if (isLoading) return <LoadingPage />;

  if (isError || !aircraft) {
    return (
      <ContentLayout title="Aeronave">
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
          <Plane className="size-10 opacity-20" />
          <p className="text-sm">
            No se encontró la aeronave <span className="font-mono font-medium">{decodedAcronym}</span>.
          </p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title={`Aeronave: ${aircraft.acronym}`}>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* ── Header ── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Button type="button" size="sm" variant="ghost" onClick={() => router.back()} className="shrink-0">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                      <Plane className="h-5 w-5 shrink-0" />
                      <span className="font-mono tracking-widest">{aircraft.acronym}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        S/N: {aircraft.serial || '—'}
                      </Badge>
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Factory className="h-3.5 w-3.5" />
                    {aircraft.manufacturer?.name ?? '—'}
                  </span>
                  <Separator orientation="vertical" className="h-3.5 hidden sm:block" />
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {aircraft.location?.name ?? aircraft.location?.address ?? '—'}
                  </span>
                  <Separator orientation="vertical" className="h-3.5 hidden sm:block" />
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {aircraft.client?.name ?? '—'}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {aircraft.aircraft_type && (
                  <Badge variant="outline" className="w-fit shrink-0">
                    {aircraft.aircraft_type.full_name}
                  </Badge>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsTypeDialogOpen(true)}
                  className="shrink-0"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <SimpleEditAirplaneDialog
                  isOpen={isTypeDialogOpen}
                  onOpenChange={setIsTypeDialogOpen}
                  acronym={aircraft.acronym}
                  companySlug={selectedCompany?.slug || ''}
                  currentTypeId={aircraft.aircraft_type?.id}
                  currentFlightHours={aircraft.flight_hours}
                  currentFlightCycles={aircraft.flight_cycles}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                icon={Clock}
                label="Horas de vuelo"
                value={aircraft.flight_hours?.toLocaleString?.() ?? aircraft.flight_hours}
              />
              <Stat
                icon={RotateCcw}
                label="Ciclos"
                value={aircraft.flight_cycles?.toLocaleString?.() ?? aircraft.flight_cycles}
              />
              <Stat icon={Calendar} label="Fabricación" value={formatDate(aircraft.fabricant_date)} />
              <Stat icon={Wrench} label="Tipo" value={aircraft.aircraft_type?.full_name ?? '—'} />
            </div>
          </CardContent>
        </Card>

        {/* ── Body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Árbol + historial */}
          <div className="lg:col-span-2 space-y-4">
            <HardTimeComponentsCard aircraft={aircraft} />

            <InstallationHistoryCard aircraftId={aircraft.id} />
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <AircraftDailyAverageCard average={aircraftDailyAverage} isLoading={isDailyAverageLoading} />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Notas
                </CardTitle>
                <CardDescription className="text-xs">Comentarios y observaciones</CardDescription>
              </CardHeader>
              <CardContent>
                {aircraft.comments?.trim() ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{aircraft.comments}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin comentarios.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
}
