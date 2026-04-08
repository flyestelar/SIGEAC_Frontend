'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { maintenanceControlsIndexOptions } from '@api/queries';
import { AircraftResource, MaintenanceControlResource, TaskCardResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardCheck, FileSpreadsheet, PlaneTakeoff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateWorkOrderData, useCreateWorkOrder } from '@/actions/planificacion/ordenes_trabajo/actions';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import AircraftPicker from './AircraftPicker';
import ControlsList from './ControlsList';
import SelectionSummary from './SelectionSummary';
import WorkOrderItemsDialog from './WorkOrderItemsDialog';

export type SelectedControlItem = {
  taskCardIds: Set<number>;
  description: string;
};

const WorkOrderCreator = () => {
  const { selectedCompany } = useCompanyStore();
  const router = useRouter();
  const createWorkOrder = useCreateWorkOrder();
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);

  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedControls, setSelectedControls] = useState<Map<number, SelectedControlItem>>(new Map());
  const [descriptionErrors, setDescriptionErrors] = useState<Record<number, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: {
        aircraft_id: selectedAircraftId ?? undefined,
      },
    }),
    enabled: !!selectedAircraftId,
  });

  const controls = useMemo<MaintenanceControlResource[]>(
    () => controlsResponse?.data ?? [],
    [controlsResponse],
  );

  const selectedAircraft = useMemo<AircraftResource | null>(() => {
    return aircrafts?.find((aircraft) => aircraft.id === selectedAircraftId) ?? null;
  }, [aircrafts, selectedAircraftId]);

  const selectedControlEntries = useMemo(
    () =>
      controls.reduce<Array<{ control: MaintenanceControlResource; item: SelectedControlItem }>>((acc, control) => {
        const item = selectedControls.get(control.id);
        if (item) {
          acc.push({ control, item });
        }
        return acc;
      }, []),
    [controls, selectedControls],
  );

  const totalSelectedTaskCards = useMemo(() => {
    let count = 0;
    selectedControls.forEach((item) => {
      count += item.taskCardIds.size;
    });
    return count;
  }, [selectedControls]);

  const pendingDescriptionsCount = useMemo(
    () => selectedControlEntries.filter(({ item }) => !item.description.trim()).length,
    [selectedControlEntries],
  );

  const coveragePercentage = useMemo(() => {
    const totalAvailable = controls.reduce((acc, control) => acc + (control.task_cards?.length ?? 0), 0);
    if (!totalAvailable) return 0;
    return Math.round((totalSelectedTaskCards / totalAvailable) * 100);
  }, [controls, totalSelectedTaskCards]);

  useEffect(() => {
    setSelectedControls((prev) => {
      if (prev.size === 0) return prev;

      let changed = false;
      const next = new Map<number, SelectedControlItem>();

      prev.forEach((item, controlId) => {
        const control = controls.find((entry) => entry.id === controlId);
        if (!control) {
          changed = true;
          return;
        }

        const applicableTaskIds = new Set(
          (control.task_cards ?? []).filter((taskCard) => taskCard.applicable).map((taskCard) => taskCard.id),
        );
        const filteredIds = new Set(Array.from(item.taskCardIds).filter((id) => applicableTaskIds.has(id)));

        if (filteredIds.size !== item.taskCardIds.size) {
          changed = true;
        }

        if (filteredIds.size > 0) {
          next.set(controlId, {
            ...item,
            taskCardIds: filteredIds,
          });
        } else {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [controls]);

  const handleSelectAircraft = (aircraft: AircraftResource) => {
    setSelectedAircraftId(aircraft.id);
    setSelectedControls(new Map());
    setDescriptionErrors({});
    setIsDialogOpen(false);
  };

  const handleClearAircraft = () => {
    setSelectedAircraftId(null);
    setSelectedControls(new Map());
    setDescriptionErrors({});
    setIsDialogOpen(false);
  };

  const clearDescriptionError = (controlId: number) => {
    setDescriptionErrors((prev) => {
      if (!prev[controlId]) return prev;
      const next = { ...prev };
      delete next[controlId];
      return next;
    });
  };

  const handleToggleTaskCard = (controlId: number, taskCardId: number) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      const current = next.get(controlId);
      const nextTaskCardIds = new Set(current?.taskCardIds ?? []);
      const control = controls.find((entry) => entry.id === controlId);
      const taskCard = control?.task_cards?.find((entry) => entry.id === taskCardId);

      if (!taskCard?.applicable) {
        return prev;
      }

      if (nextTaskCardIds.has(taskCardId)) {
        nextTaskCardIds.delete(taskCardId);
        if (nextTaskCardIds.size === 0) {
          next.delete(controlId);
        } else {
          next.set(controlId, {
            taskCardIds: nextTaskCardIds,
            description: current?.description ?? '',
          });
        }
      } else {
        nextTaskCardIds.add(taskCardId);
        next.set(controlId, {
          taskCardIds: nextTaskCardIds,
          description: current?.description ?? control?.title ?? '',
        });
      }

      return next;
    });
    clearDescriptionError(controlId);
  };

  const handleToggleAllTaskCards = (
    controlId: number,
    taskCards: TaskCardResource[],
    defaultDescription: string,
  ) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      const current = next.get(controlId);
      const taskCardIds = taskCards.filter((taskCard) => taskCard.applicable).map((taskCard) => taskCard.id);
      const allSelected = taskCardIds.length > 0 && taskCardIds.every((id) => current?.taskCardIds.has(id));

      if (taskCardIds.length === 0) {
        next.delete(controlId);
        return next;
      }

      if (allSelected) {
        next.delete(controlId);
      } else {
        next.set(controlId, {
          taskCardIds: new Set(taskCardIds),
          description: current?.description ?? defaultDescription,
        });
      }

      return next;
    });
    clearDescriptionError(controlId);
  };

  const handleDescriptionChange = (controlId: number, description: string) => {
    setSelectedControls((prev) => {
      const current = prev.get(controlId);
      if (!current) return prev;

      const next = new Map(prev);
      next.set(controlId, {
        ...current,
        description,
      });
      return next;
    });
    clearDescriptionError(controlId);
  };

  const handleOpenDialog = () => {
    if (!selectedAircraftId || totalSelectedTaskCards === 0 || createWorkOrder.isPending) return;
    setDescriptionErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedAircraftId || !selectedCompany?.slug) return;

    const nextErrors = selectedControlEntries.reduce<Record<number, string>>((acc, entry) => {
      if (!entry.item.description.trim()) {
        acc[entry.control.id] = 'La descripcion es obligatoria.';
      }
      return acc;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      setDescriptionErrors(nextErrors);
      return;
    }

    const payload: CreateWorkOrderData = {
      aircraft_id: selectedAircraftId,
      items: selectedControlEntries.map(({ control, item }) => ({
        description: item.description.trim(),
        maintenance_control_id: control.id,
        maintenance_control_tasks_ids: Array.from(item.taskCardIds),
      })),
    };

    await createWorkOrder.mutateAsync({ data: payload, company: selectedCompany.slug });
    setIsDialogOpen(false);
    router.push(`/${selectedCompany.slug}/planificacion/ordenes_trabajo`);
  }, [createWorkOrder, router, selectedAircraftId, selectedCompany, selectedControlEntries]);

  if (isAircraftsLoading) {
    return <LoadingPage />;
  }

  if (isAircraftsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>Error al cargar las aeronaves. Intente recargar la pagina.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="rounded-lg border bg-background">
        <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <FileSpreadsheet className="size-3.5" />
              Preparacion documental
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Nueva Orden de Trabajo</h1>
              <p className="text-sm text-muted-foreground">
                Arme la WO como un manifiesto tecnico: seleccione task cards, revise cobertura y valide items antes de emitir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Aeronave</p>
              <p className="mt-1 font-mono text-sm font-semibold">{selectedAircraft?.acronym ?? 'Pendiente'}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Controles</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{selectedControlEntries.length}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Task cards</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{totalSelectedTaskCards}</p>
            </div>
            <div className="rounded-md border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Cobertura</p>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{coveragePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-3 md:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border bg-muted/30">
              <PlaneTakeoff className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Contexto</p>
              <p className="truncate text-sm">{selectedAircraft ? 'Aeronave lista para planificar' : 'Seleccione una aeronave'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border bg-muted/30">
              <ClipboardCheck className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Validacion</p>
              <p className="truncate text-sm">
                {pendingDescriptionsCount > 0
                  ? `${pendingDescriptionsCount} item${pendingDescriptionsCount !== 1 ? 's' : ''} pendiente${pendingDescriptionsCount !== 1 ? 's' : ''}`
                  : 'Sin pendientes de descripcion'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded border bg-muted/30">
              <FileSpreadsheet className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Emision</p>
              <p className="truncate text-sm">
                {totalSelectedTaskCards > 0 ? 'Documento en preparacion' : 'Sin seleccion para emitir'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AircraftPicker
        aircrafts={aircrafts ?? []}
        selectedAircraft={selectedAircraft}
        onSelect={handleSelectAircraft}
        onClear={handleClearAircraft}
      />

      {selectedAircraft && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ControlsList
              controls={controls}
              selectedControls={selectedControls}
              isLoading={isControlsLoading}
              onToggleTaskCard={handleToggleTaskCard}
              onToggleAllTaskCards={handleToggleAllTaskCards}
            />
          </div>

          <div className="lg:col-span-4">
            <SelectionSummary
              aircraft={selectedAircraft}
              controls={controls}
              selectedControls={selectedControls}
              totalTaskCards={totalSelectedTaskCards}
              pendingDescriptionsCount={pendingDescriptionsCount}
              coveragePercentage={coveragePercentage}
              onSubmit={handleOpenDialog}
              isSubmitting={createWorkOrder.isPending}
            />
          </div>
        </div>
      )}

      <WorkOrderItemsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedControls={selectedControlEntries}
        errors={descriptionErrors}
        isSubmitting={createWorkOrder.isPending}
        onDescriptionChange={handleDescriptionChange}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default WorkOrderCreator;
