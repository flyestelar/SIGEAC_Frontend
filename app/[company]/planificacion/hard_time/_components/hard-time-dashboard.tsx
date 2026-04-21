'use client';

import { workOrdersIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Plus, SearchCheck, Upload, Wrench } from 'lucide-react';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HardTimeCardSkeletonGrid } from './hard-time-card-skeleton';
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
import { AircraftComponentSlotResource } from '@api/types';

export function HardTimeDashboard() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<AircraftComponentSlotResource | null>(null);
  const [isCreateComponentOpen, setIsCreateComponentOpen] = useState(false);
  const [createComponentDefaultCategory, setCreateComponentDefaultCategory] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [installingComponent, setInstallingComponent] = useState<AircraftComponentSlotResource | null>(null);
  const [uninstallingComponent, setUninstallingComponent] = useState<AircraftComponentSlotResource | null>(null);
  const [isIntervalDialogOpen, setIsIntervalDialogOpen] = useState(false);
  const [editingInterval, setEditingInterval] = useState<HardTimeInterval | null>(null);
  const [intervalTargetComponent, setIntervalTargetComponent] = useState<AircraftComponentSlotResource | null>(null);
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);

  const { data: aircraft = [], isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: categories = [] } = useGetHardTimeCategories();
  const {
    data: groupsResponse,
    isLoading: isComponentsLoading,
    isError: isComponentsError,
  } = useGetHardTimeComponents(selectedAircraftId);
  const { data: selectedComponentDetail } = useGetHardTimeComponentDetail(selectedComponent?.id);

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
    if (!selectedComponent) return;
    if (componentsList.some((component) => component.id === selectedComponent.id)) return;
    setSelectedComponent(null);
  }, [componentsList, selectedComponent]);

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
    componentsList.find((component) => component.id === installingComponent?.id)?.part_number ??
    '';

  const handleSelectAircraft = (id: number) => {
    startTransition(() => {
      setSelectedAircraftId(id);
      setSelectedComponent(null);
    });
  };

  const handleSelectComponent = (component: AircraftComponentSlotResource) => {
    startTransition(() => {
      setSelectedComponent(component);
    });
  };

  const openInstall = (component: AircraftComponentSlotResource) => {
    setInstallingComponent(component);
  };

  const openUninstall = (component: AircraftComponentSlotResource) => {
    setSelectedComponent(component);
    setUninstallingComponent(component);
  };

  const openCreateInterval = (component: AircraftComponentSlotResource) => {
    setIntervalTargetComponent(component);
    setEditingInterval(null);
    setIsIntervalDialogOpen(true);
  };

  const openCreateComponent = (categoryCode: string | null = null) => {
    setCreateComponentDefaultCategory(categoryCode);
    setIsCreateComponentOpen(true);
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
              <Button className="gap-2" onClick={() => openCreateComponent(null)} disabled={!selectedAircraftId}>
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
                <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                  <aside className="space-y-2 rounded-xl border border-border/60 bg-background p-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-[60px] animate-pulse rounded-xl border border-border/60 bg-muted/20" />
                    ))}
                  </aside>
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-background p-4">
                    <HardTimeCardSkeletonGrid count={6} />
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <SectionEmpty
                  title="Sin capítulos ATA disponibles"
                  description="No hay capítulos ATA configurados. Contacta al administrador."
                />
              ) : selectedComponent ? (
                <HardTimeDetailView
                  componentId={selectedComponent.id}
                  aircraftId={selectedAircraftId}
                  averageDailyFH={averages?.average_daily_flight_hours ?? null}
                  averageDailyFC={averages?.average_daily_flight_cycles ?? null}
                  onBack={() => setSelectedComponent(null)}
                  onInstall={() => openInstall(selectedComponent)}
                  onUninstall={() => openUninstall(selectedComponent)}
                  onCreateInterval={() => openCreateInterval(selectedComponent)}
                  onRegisterCompliance={() => setIsComplianceDialogOpen(true)}
                />
              ) : (
                <HardTimeCategorySidebar
                  categories={categories}
                  categoryGroups={categoryGroups}
                  averages={averages}
                  onSelectComponent={handleSelectComponent}
                  onInstallComponent={openInstall}
                  onUninstallComponent={openUninstall}
                  onCreateIntervalForComponent={openCreateInterval}
                  onCreateComponentInAta={(code) => openCreateComponent(code)}
                />
              )}
            </>
          )}
        </div>
      </main>

      <CreateComponentDialog
        open={isCreateComponentOpen}
        onOpenChange={(open) => {
          setIsCreateComponentOpen(open);
          if (!open) setCreateComponentDefaultCategory(null);
        }}
        aircraftId={selectedAircraftId}
        categories={categories}
        defaultCategoryCode={createComponentDefaultCategory}
      />

      <HardTimeImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        aircraftId={selectedAircraftId}
        categories={categories}
      />

      <InstallComponentDialog
        open={installingComponent !== null}
        onOpenChange={(open) => {
          if (!open) setInstallingComponent(null);
        }}
        componentId={installingComponent?.id ?? null}
        aircraft={selectedAircraft}
        defaultPartNumber={installingComponentPartNumber}
      />

      <UninstallComponentDialog
        open={uninstallingComponent !== null}
        onOpenChange={(open) => {
          if (!open) setUninstallingComponent(null);
        }}
        componentId={uninstallingComponent?.id ?? null}
        aircraft={selectedAircraft}
      />

      <IntervalDialog
        open={isIntervalDialogOpen}
        onOpenChange={(open) => {
          setIsIntervalDialogOpen(open);
          if (!open) {
            setEditingInterval(null);
            setIntervalTargetComponent(null);
          }
        }}
        partId={intervalTargetComponent?.installed_part_id ?? selectedComponent?.installed_part_id ?? 0}
        componentId={intervalTargetComponent?.id ?? selectedComponent?.id ?? null}
        aircraftId={selectedAircraftId}
        interval={editingInterval}
      />

      <ComplianceDialog
        open={isComplianceDialogOpen}
        onOpenChange={setIsComplianceDialogOpen}
        componentId={selectedComponent?.id ?? null}
        aircraft={selectedAircraft}
        intervals={selectedComponentDetail?.installed_part?.intervals ?? []}
        workOrders={workOrders}
      />
    </ContentLayout>
  );
}
