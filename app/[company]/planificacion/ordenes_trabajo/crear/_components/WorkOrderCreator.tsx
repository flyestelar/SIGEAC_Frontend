'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetMaintenanceControl } from '@/hooks/planificacion/control_mantenimiento/useGetMaintenanceControl';
import {
  CreateWorkOrderData,
  useCreateWorkOrder,
} from '@/actions/planificacion/ordenes_trabajo/actions';
import { useCompanyStore } from '@/stores/CompanyStore';
import { MaintenanceAircraft, TaskCard } from '@/types';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: controlsResponse, isLoading: isControlsLoading } = useGetMaintenanceControl();
  const createWorkOrder = useCreateWorkOrder();
  const router = useRouter();

  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedControls, setSelectedControls] = useState<Map<number, SelectedControlItem>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [descriptionErrors, setDescriptionErrors] = useState<Record<number, string>>({});

  const controls = useMemo(() => controlsResponse?.data ?? [], [controlsResponse]);

  const selectedAircraft = useMemo(() => {
    return aircrafts?.find((a) => a.id === selectedAircraftId) ?? null;
  }, [aircrafts, selectedAircraftId]);

  const controlsForAircraft = useMemo(() => {
    if (!selectedAircraft) return [];
    return controls.filter((c) => c.aircrafts.some((ac) => ac.id === selectedAircraft.id));
  }, [controls, selectedAircraft]);

  const selectedControlEntries = useMemo(() => {
    return controlsForAircraft
      .filter((control) => selectedControls.has(control.id))
      .map((control) => ({
        control,
        item: selectedControls.get(control.id)!,
      }));
  }, [controlsForAircraft, selectedControls]);

  const handleSelectAircraft = (aircraft: MaintenanceAircraft) => {
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

  const handleToggleTaskCard = (controlId: number, taskCardId: number) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      const currentItem = next.get(controlId);
      const currentTaskCardIds = new Set(currentItem?.taskCardIds ?? []);

      if (currentTaskCardIds.has(taskCardId)) {
        currentTaskCardIds.delete(taskCardId);
        if (currentTaskCardIds.size === 0) {
          next.delete(controlId);
        } else {
          next.set(controlId, {
            taskCardIds: currentTaskCardIds,
            description: currentItem?.description ?? '',
          });
        }
      } else {
        currentTaskCardIds.add(taskCardId);
        next.set(controlId, {
          taskCardIds: currentTaskCardIds,
          description: currentItem?.description ?? controlsForAircraft.find((control) => control.id === controlId)?.title ?? '',
        });
      }

      return next;
    });
    setDescriptionErrors((prev) => {
      if (!prev[controlId]) return prev;
      const next = { ...prev };
      delete next[controlId];
      return next;
    });
  };

  const handleToggleAllTaskCards = (controlId: number, taskCards: TaskCard[], defaultDescription: string) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      const current = next.get(controlId);
      const allSelected = current?.taskCardIds.size === taskCards.length;

      if (allSelected) {
        next.delete(controlId);
      } else {
        next.set(controlId, {
          taskCardIds: new Set(taskCards.map((tc) => tc.id)),
          description: current?.description ?? defaultDescription,
        });
      }

      return next;
    });
    setDescriptionErrors((prev) => {
      if (!prev[controlId]) return prev;
      const next = { ...prev };
      delete next[controlId];
      return next;
    });
  };

  const totalSelectedTaskCards = useMemo(() => {
    let count = 0;
    selectedControls.forEach((item) => (count += item.taskCardIds.size));
    return count;
  }, [selectedControls]);

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
    setDescriptionErrors((prev) => {
      if (!prev[controlId]) return prev;
      const next = { ...prev };
      delete next[controlId];
      return next;
    });
  };

  const handleOpenDialog = () => {
    if (totalSelectedTaskCards === 0 || createWorkOrder.isPending) return;
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

    // await createWorkOrder.mutateAsync({ data: payload, company: selectedCompany.slug });
    // setIsDialogOpen(false);
    // router.push(`/${selectedCompany.slug}/planificacion/ordenes_trabajo`);
    console.log(payload)
  }, [selectedAircraftId, selectedCompany, selectedControlEntries, createWorkOrder, router]);

  if (isAircraftsLoading || isControlsLoading) {
    return <LoadingPage />;
  }

  if (isAircraftsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>Error al cargar las aeronaves. Intente recargar la página.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Orden de Trabajo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Seleccione una aeronave y los controles de mantenimiento a incluir.
        </p>
      </div>

      {/* Phase 1: Aircraft selection */}
      <AircraftPicker
        aircrafts={aircrafts ?? []}
        selectedAircraft={selectedAircraft}
        onSelect={handleSelectAircraft}
        onClear={handleClearAircraft}
      />

      {/* Phase 2: Controls + task cards */}
      {selectedAircraft && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ControlsList
              controls={controlsForAircraft}
              selectedControls={selectedControls}
              onToggleTaskCard={handleToggleTaskCard}
              onToggleAllTaskCards={handleToggleAllTaskCards}
            />
          </div>
          <div className="lg:col-span-4">
            <SelectionSummary
              aircraft={selectedAircraft}
              controls={controlsForAircraft}
              selectedControls={selectedControls}
              totalTaskCards={totalSelectedTaskCards}
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
