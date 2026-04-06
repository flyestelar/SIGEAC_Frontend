'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Plus, Settings2, Siren } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AircraftSelector } from './_components/aircraft-selector';
import { MaintenanceControlsSection } from './_components/maintenance-controls-section';

export default function MaintenanceDashboard() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedControlId, setSelectedControlId] = useState<number | null>(null);

  const { data: aircraft = [], isLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);

  const selectedAircraft = useMemo(() => {
    return aircraft.find((ac) => ac.id === selectedAircraftId) ?? null;
  }, [aircraft, selectedAircraftId]);

  const handleSelectAircraft = (id: number) => {
    setSelectedAircraftId(id);
    setSelectedControlId(null);
  };

  if (isLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Control Mantenimiento">
      <main className="p-4 lg:p-6 max-w-[2080px]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">Control de Mantenimiento</h2>
              {selectedAircraft && (
                <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                  {selectedAircraft.acronym}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedAircraft
                ? `${selectedAircraft.manufacturer?.name ?? ''} ${selectedAircraft.aircraft_type?.series ?? ''} — S/N ${selectedAircraft.serial}`
                : 'Selecciona una aeronave para inspeccionar sus programas de mantenimiento'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/alertas`}>
                <Siren className="h-4 w-4" />
                Dashboard Alertas
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href={`/${selectedCompany?.slug}/planificacion/control_mantenimiento/nuevo`}>
                <Plus className="h-4 w-4" />
                Nuevo Control
              </Link>
            </Button>
            <Settings2 className="h-5 w-5 text-muted-foreground/50" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <AircraftSelector
              aircraft={aircraft}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={handleSelectAircraft}
            />
          </div>

          <MaintenanceControlsSection
            selectedControlId={selectedControlId}
            onSelectControl={setSelectedControlId}
            selectedAircraft={selectedAircraft}
            selectedAircraftId={selectedAircraftId}
          />
        </div>
      </main>
    </ContentLayout>
  );
}
