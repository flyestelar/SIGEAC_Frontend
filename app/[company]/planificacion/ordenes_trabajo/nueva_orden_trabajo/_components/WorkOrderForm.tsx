'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { maintenanceControlsIndexOptions } from '@api/queries';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AircraftResource, MaintenanceControlResource, StoreWorkOrderRequest, TaskCardResource } from '@api/types';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useCreateWorkOrder } from '@/actions/planificacion/ordenes_trabajo/actions';
import AircraftDetailsCard from './AircraftDetailsCard';
import MaintenanceControlDialog from './MaintenanceControlDialog';
import TaskCardsTable from './TaskCardsTable';

export type SelectedControl = {
  control: MaintenanceControlResource;
  description: string;
};

const WorkOrderForm = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  const { data: aircrafts, isLoading: isAircraftsLoading, isError: isAircraftsError } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const createWorkOrder = useCreateWorkOrder();
  const router = useRouter();

  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedControls, setSelectedControls] = useState<Map<number, SelectedControl>>(new Map());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [description, setDescription] = useState('');

  const selectedAircraft = useMemo(() => {
    return aircrafts?.find((a) => a.id === selectedAircraftId) ?? null;
  }, [aircrafts, selectedAircraftId]);

  // Fetch controls filtered by aircraft_id — only when aircraft is selected
  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({ query: { aircraft_id: selectedAircraftId! } }),
    enabled: !!selectedAircraftId,
  });

  const controls = useMemo(() => controlsResponse?.data ?? [], [controlsResponse]);

  const taskCardsFlat = useMemo(() => {
    const rows: { controlTitle: string; controlId: number; taskCard: TaskCardResource }[] = [];
    selectedControls.forEach(({ control }) => {
      (control.task_cards ?? []).forEach((tc) => {
        rows.push({ controlTitle: control.title, controlId: control.id, taskCard: tc });
      });
    });
    return rows;
  }, [selectedControls]);

  const handleSelectAircraft = (aircraft: AircraftResource) => {
    setSelectedAircraftId(aircraft.id);
    setSelectedControls(new Map());
  };

  const handleClearAircraft = () => {
    setSelectedAircraftId(null);
    setSelectedControls(new Map());
  };

  const handleConfirmControls = (controlIds: Set<number>) => {
    setSelectedControls((prev) => {
      const next = new Map<number, SelectedControl>();
      controlIds.forEach((id) => {
        const existing = prev.get(id);
        if (existing) {
          next.set(id, existing);
        } else {
          const control = controls.find((c) => c.id === id);
          if (control) {
            next.set(id, { control, description: control.title });
          }
        }
      });
      return next;
    });
    setIsDialogOpen(false);
  };

  const handleRemoveControl = (controlId: number) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      next.delete(controlId);
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedAircraftId || !selectedCompany?.slug) return;

    if (selectedControls.size === 0) {
      toast.error('Debe seleccionar al menos un control de mantenimiento.');
      return;
    }

    if (!description.trim()) {
      toast.error('Las observaciones de la orden son obligatorias.');
      return;
    }

    const payload: StoreWorkOrderRequest = {
      aircraft_id: selectedAircraftId,
      remarks: description.trim(),
      items: Array.from(selectedControls.values()).map(({ control }) => ({
        maintenance_control_id: control.id,
        task_ids: (control.task_cards ?? []).map((tc) => tc.id),
      })),
    };

    await createWorkOrder.mutateAsync({ body: payload });
    router.push(`/${selectedCompany.slug}/planificacion/ordenes_trabajo`);
  }, [selectedAircraftId, selectedCompany, selectedControls, description, createWorkOrder, router]);

  if (isAircraftsLoading) return <LoadingPage />;

  if (isAircraftsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertDescription>Error al cargar las aeronaves. Intente recargar la página.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Document header */}
      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Orden de Trabajo</h1>
            <p className="text-xs text-muted-foreground">Planificación — Nueva orden</p>
          </div>
          {selectedStation && (
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Estación</span>
              <p className="text-sm font-mono font-medium">{selectedStation}</p>
            </div>
          )}
        </div>

        {/* Aircraft details */}
        <AircraftDetailsCard
          aircrafts={aircrafts ?? []}
          selectedAircraft={selectedAircraft}
          onSelect={handleSelectAircraft}
          onClear={handleClearAircraft}
        />

        {/* Description */}
        {selectedAircraft && (
          <div className="border-t px-5 py-4">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Observaciones
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escriba observaciones relevantes para la orden de trabajo…"
              rows={2}
              className="mt-1.5"
            />
          </div>
        )}
      </div>

      {/* Task cards table */}
      {selectedAircraft && (
        <div className="rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Servicios Programados
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {taskCardsFlat.length} task card{taskCardsFlat.length !== 1 ? 's' : ''} en{' '}
                {selectedControls.size} control{selectedControls.size !== 1 ? 'es' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={isControlsLoading}
              onClick={() => setIsDialogOpen(true)}
            >
              {isControlsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
              Agregar Controles
            </Button>
          </div>

          <TaskCardsTable rows={taskCardsFlat} onRemoveControl={handleRemoveControl} />
        </div>
      )}

      {/* Submit */}
      {selectedAircraft && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/${selectedCompany!.slug}/planificacion/ordenes_trabajo`)}
          >
            Cancelar
          </Button>
          <Button
            className="gap-2"
            disabled={selectedControls.size === 0 || createWorkOrder.isPending}
            onClick={handleSubmit}
          >
            {createWorkOrder.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {createWorkOrder.isPending ? 'Creando…' : 'Crear Orden de Trabajo'}
          </Button>
        </div>
      )}

      {/* Dialog */}
      <MaintenanceControlDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        controls={controls}
        selectedControlIds={new Set(selectedControls.keys())}
        aircraft={selectedAircraft}
        onConfirm={handleConfirmControls}
      />
    </div>
  );
};

export default WorkOrderForm;
