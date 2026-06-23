'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { useGetMaintenanceControlById } from '@/hooks/planificacion/control_mantenimiento/useGetMaintenanceControlById';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useMemo } from 'react';
import { SelectedControlHeader } from '../_components/control-header';
import { MaintenanceControlDetail } from '../_components/maintenance-control-detail';
import { computeMetrics, worstStatus } from '../_data/utils';
import { intersectionBy, intersectionWith } from 'es-toolkit';

export default function MaintenanceControlDetailPage() {
  const params = useParams<{ company: string; id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedCompany } = useCompanyStore();

  const controlId = params.id;
  const company = params.company;

  const selectedAircraftId = useMemo(() => {
    const aircraftId = searchParams.get('aircraft_id');
    if (!aircraftId) return null;
    const parsed = Number(aircraftId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const {
    data: controlResponse,
    isLoading: isControlLoading,
    isPlaceholderData: isControlStale,
  } = useGetMaintenanceControlById({
    id: controlId,
    aircraftId: selectedAircraftId ?? undefined,
  });
  const { data: aircraftsBase, isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(company);
  const aircrafts = intersectionWith(
    aircraftsBase ?? [],
    controlResponse?.data?.aircraft_ids ?? [],
    (a, id) => a.id === id,
  );

  const selectedAircraft = aircrafts.find((ac) => ac.id === selectedAircraftId) ?? null;

  const control = controlResponse?.data ?? null;

  const computedControl = useMemo(() => {
    if (!control) return null;
    const metrics = computeMetrics(control);
    const status = worstStatus(metrics);
    return { control, metrics, status };
  }, [control]);

  const handleSelectAircraft = useCallback(
    (id: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('aircraft_id', id.toString());
      router.replace(`/${company}/planificacion/control_mantenimiento/${controlId}?${params.toString()}`);
    },
    [searchParams, company, controlId, router],
  );

  const handleBack = () => {
    const basePath = `/${selectedCompany?.slug ?? company}/planificacion/control_mantenimiento`;
    if (selectedAircraftId) {
      router.push(`${basePath}?aircraft_id=${selectedAircraftId}`);
    } else {
      router.push(basePath);
    }
  };

  if (!control) {
    if (isControlLoading || isAircraftLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return (
      <ContentLayout>
        <div className="max-w-4xl mx-auto space-y-6 px-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Control no encontrado</h1>
              <p className="text-muted-foreground">
                El control de mantenimiento solicitado no existe o no está disponible.
              </p>
            </div>
          </div>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout className="flex flex-col">
      <main className="flex-1 flex flex-col px-4 lg:px-6 max-w-[2080px] space-y-4">
        {computedControl && (
          <SelectedControlHeader
            computed={computedControl}
            onBack={handleBack}
            aircraft={aircrafts}
            selectedAircraftId={selectedAircraftId}
            onSelectAircraft={handleSelectAircraft}
          />
        )}
        {isControlStale ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MaintenanceControlDetail
            control={control}
            aircraft={selectedAircraft}
            selectedAircraftId={selectedAircraftId}
          />
        )}
      </main>
    </ContentLayout>
  );
}
