'use client';

import { workOrdersIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, SearchCheck, Upload, Wrench } from 'lucide-react';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetHardTimeCategories } from '@/hooks/planificacion/hard_time/useGetHardTimeCategories';
import { useGetHardTimeComponentDetail } from '@/hooks/planificacion/hard_time/useGetHardTimeComponentDetail';
import { useGetHardTimeComponents } from '@/hooks/planificacion/hard_time/useGetHardTimeComponents';
import { useCompanyStore } from '@/stores/CompanyStore';
import { HardTimeInterval } from '@/types';
import { AircraftAverageSummaryCard } from '../../control_mantenimiento/_components/aircraft-average-summary-card';
import { AircraftSelector } from '../../control_mantenimiento/_components/aircraft-selector';
import { HardTimeCategorySidebar } from './hard-time-category-sidebar';
import { HardTimeDetailView } from './hard-time-detail-view';
import { SectionEmpty } from './hard-time-dashboard/section-empty';
import { CreateComponentDialog } from './hard-time-dashboard/create-component-dialog';
import { UninstallComponentDialog } from './hard-time-dashboard/uninstall-component-dialog';
import { IntervalDialog } from './hard-time-dashboard/interval-dialog';
import { ComplianceDialog } from './hard-time-dashboard/compliance-dialog';
import { HardTimeImportDialog } from './hard-time-import-dialog';
import { InstallComponentDialog } from './install-component-dialog';

export function HardTimeDashboard() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [isCreateComponentOpen, setIsCreateComponentOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [installingComponentId, setInstallingComponentId] = useState<number | null>(null);
  const [uninstallingComponentId, setUninstallingComponentId] = useState<number | null>(null);
  const [isIntervalDialogOpen, setIsIntervalDialogOpen] = useState(false);
  const [editingInterval, setEditingInterval] = useState<HardTimeInterval | null>(null);
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);

  const { data: aircraft = [], isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: categories = [] } = useGetHardTimeCategories();
  const {
    data: groupsResponse,
    isLoading: isComponentsLoading,
    isError: isComponentsError,
  } = useGetHardTimeComponents(selectedAircraftId);
  const { data: selectedComponentDetail } = useGetHardTimeComponentDetail(selectedComponentId, selectedAircraftId);

  const selectedAircraft = useMemo(
    () => aircraft.find((item) => item.id === selectedAircraftId) ?? null,
    [aircraft, selectedAircraftId],
  );

  const componentsList = useMemo(() => groupsResponse?.data ?? [], [groupsResponse]);

  const categoryGroups = useMemo(() => {
    const map = Map.groupBy(componentsList, (comp) => comp?.category?.code ?? comp?.category_code ?? 'uncategorized');
    return Array.from(map.values());
  }, [componentsList]);

  useEffect(() => {
    if (!selectedComponentId) return;
    if (componentsList.some((component) => component.id === selectedComponentId)) return;
    setSelectedComponentId(null);
  }, [componentsList, selectedComponentId]);

  const { data: workOrdersResponse } = useQuery({
    ...workOrdersIndexOptions({
      query: {
        per_page: 100,
      },
    }),
    enabled: isComplianceDialogOpen,
  });

  const workOrders = workOrdersResponse?.data ?? [];
  const averages = selectedAircraft?.last_average_metric ?? null;
  const installingComponentPartNumber =
    selectedComponentDetail?.part_number ??
    componentsList.find((component) => component.id === installingComponentId)?.part_number ??
    '';

  const handleSelectAircraft = (id: number) => {
    startTransition(() => {
      setSelectedAircraftId(id);
      setSelectedComponentId(null);
    });
  };

  const handleSelectComponent = (id: number) => {
    startTransition(() => {
      setSelectedComponentId(id);
    });
  };

  const openInstall = (componentId: number) => {
    setInstallingComponentId(componentId);
  };

  const openUninstall = (componentId: number) => {
    setSelectedComponentId(componentId);
    setUninstallingComponentId(componentId);
  };

  if (isAircraftLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Control Hard Time">
      <main className="max-w-[2080px] p-4 lg:p-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
                <Wrench className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Control Hard Time</h1>
                <p className="text-sm text-muted-foreground">
                  Seguimiento de componentes limitados por horas, ciclos y calendario.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsImportDialogOpen(true)}
                disabled={!selectedAircraftId}
              >
                <Upload className="size-4" />
                Importar INAC
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/${selectedCompany?.slug}/planificacion/hard_time/trazabilidad`}>
                  <SearchCheck className="size-4" />
                  Trazabilidad
                </Link>
              </Button>
              <Button className="gap-2" onClick={() => setIsCreateComponentOpen(true)} disabled={!selectedAircraftId}>
                <Plus className="size-4" />
                Nuevo componente ATA
              </Button>
            </div>
          </div>

          <AircraftSelector
            aircraft={aircraft}
            selectedAircraftId={selectedAircraftId}
            onSelectAircraft={handleSelectAircraft}
          />

          {!selectedAircraftId ? (
            <SectionEmpty
              title="Selecciona aeronave"
              description="Escoge aeronave para cargar componentes controlados, intervalos y cumplimientos Hard Time."
            />
          ) : (
            <>
              <AircraftAverageSummaryCard averages={averages} />

              {isComponentsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>No se pudieron cargar los componentes Hard Time.</AlertDescription>
                </Alert>
              ) : isComponentsLoading ? (
                <Card>
                  <CardContent className="flex min-h-40 items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : categoryGroups.length === 0 ? (
                <SectionEmpty
                  title="Sin componentes controlados"
                  description="Aeronave aún no tiene componentes Hard Time registrados."
                  action={
                    <Button onClick={() => setIsCreateComponentOpen(true)} className="gap-2">
                      <Plus className="size-4" />
                      Crear primer componente
                    </Button>
                  }
                />
              ) : selectedComponentId ? (
                <HardTimeDetailView
                  componentId={selectedComponentId}
                  aircraftId={selectedAircraftId}
                  averageDailyFH={averages?.average_daily_flight_hours ?? null}
                  averageDailyFC={averages?.average_daily_flight_cycles ?? null}
                  onBack={() => setSelectedComponentId(null)}
                  onInstall={() => openInstall(selectedComponentId)}
                  onUninstall={() => openUninstall(selectedComponentId)}
                  onCreateInterval={() => {
                    setEditingInterval(null);
                    setIsIntervalDialogOpen(true);
                  }}
                  onRegisterCompliance={() => setIsComplianceDialogOpen(true)}
                />
              ) : (
                <HardTimeCategorySidebar
                  categoryGroups={categoryGroups}
                  averages={averages}
                  onSelectComponent={handleSelectComponent}
                  onInstallComponent={openInstall}
                  onUninstallComponent={openUninstall}
                />
              )}
            </>
          )}
        </div>
      </main>

      <CreateComponentDialog
        open={isCreateComponentOpen}
        onOpenChange={setIsCreateComponentOpen}
        aircraftId={selectedAircraftId}
        categories={categories}
      />

      <HardTimeImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        aircraftId={selectedAircraftId}
        categories={categories}
      />

      <InstallComponentDialog
        open={installingComponentId !== null}
        onOpenChange={(open) => {
          if (!open) setInstallingComponentId(null);
        }}
        componentId={installingComponentId}
        aircraft={selectedAircraft}
        defaultPartNumber={installingComponentPartNumber}
      />

      <UninstallComponentDialog
        open={uninstallingComponentId !== null}
        onOpenChange={(open) => {
          if (!open) setUninstallingComponentId(null);
        }}
        componentId={uninstallingComponentId}
        aircraft={selectedAircraft}
      />

      <IntervalDialog
        open={isIntervalDialogOpen}
        onOpenChange={(open) => {
          setIsIntervalDialogOpen(open);
          if (!open) setEditingInterval(null);
        }}
        componentId={selectedComponentId}
        aircraftId={selectedAircraftId}
        interval={editingInterval}
      />

      <ComplianceDialog
        open={isComplianceDialogOpen}
        onOpenChange={setIsComplianceDialogOpen}
        componentId={selectedComponentId}
        aircraft={selectedAircraft}
        intervals={selectedComponentDetail?.intervals ?? []}
        workOrders={workOrders}
      />
    </ContentLayout>
  );
}
