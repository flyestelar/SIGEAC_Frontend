'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { maintenanceControlsIndexOptions } from '@api/queries';
import { AircraftResource, MaintenanceControlResource, StoreWorkOrderRequest, TaskCardResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, MessageSquareText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateWorkOrder } from '@/actions/planificacion/ordenes_trabajo/actions';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useCompanyStore } from '@/stores/CompanyStore';
import AircraftHeader from './AircraftHeader';
import ControlsList from './ControlsList';
import SelectionSummary from './SelectionSummary';

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
  const [remarks, setRemarks] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [exitDate, setExitDate] = useState('');

  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: { aircraft_id: selectedAircraftId ?? undefined },
    }),
    enabled: !!selectedAircraftId,
  });

  const controls = useMemo<MaintenanceControlResource[]>(() => controlsResponse?.data ?? [], [controlsResponse]);

  const selectedAircraft = useMemo<AircraftResource | null>(() => {
    return aircrafts?.find((a) => a.id === selectedAircraftId) ?? null;
  }, [aircrafts, selectedAircraftId]);

  const selectedControlEntries = useMemo(
    () =>
      controls.reduce<Array<{ control: MaintenanceControlResource; item: SelectedControlItem }>>((acc, control) => {
        const item = selectedControls.get(control.id);
        if (item) acc.push({ control, item });
        return acc;
      }, []),
    [controls, selectedControls],
  );

  const totalSelectedTaskCards = useMemo(() => {
    let count = 0;
    selectedControls.forEach((item) => (count += item.taskCardIds.size));
    return count;
  }, [selectedControls]);

  // Sync selected controls when controls data changes
  useEffect(() => {
    setSelectedControls((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Map<number, SelectedControlItem>();
      prev.forEach((item, controlId) => {
        const control = controls.find((c) => c.id === controlId);
        if (!control) { changed = true; return; }
        const applicableIds = new Set((control.task_cards ?? []).filter((tc) => tc.applicable).map((tc) => tc.id));
        const filteredIds = new Set(Array.from(item.taskCardIds).filter((id) => applicableIds.has(id)));
        if (filteredIds.size !== item.taskCardIds.size) changed = true;
        if (filteredIds.size > 0) {
          next.set(controlId, { ...item, taskCardIds: filteredIds });
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
    setRemarks('');
    setEntryDate('');
    setExitDate('');
  };

  const handleClearAircraft = () => {
    setSelectedAircraftId(null);
    setSelectedControls(new Map());
    setDescriptionErrors({});
    setRemarks('');
    setEntryDate('');
    setExitDate('');
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
      const nextIds = new Set(current?.taskCardIds ?? []);
      const control = controls.find((c) => c.id === controlId);
      const tc = control?.task_cards?.find((t) => t.id === taskCardId);
      if (!tc?.applicable) return prev;

      if (nextIds.has(taskCardId)) {
        nextIds.delete(taskCardId);
        if (nextIds.size === 0) next.delete(controlId);
        else next.set(controlId, { taskCardIds: nextIds, description: current?.description ?? '' });
      } else {
        nextIds.add(taskCardId);
        next.set(controlId, { taskCardIds: nextIds, description: current?.description ?? control?.title ?? '' });
      }
      return next;
    });
    clearDescriptionError(controlId);
  };

  const handleToggleAllTaskCards = (controlId: number, taskCards: TaskCardResource[], defaultDescription: string) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      const current = next.get(controlId);
      const applicableIds = taskCards.filter((tc) => tc.applicable).map((tc) => tc.id);
      const allSelected = applicableIds.length > 0 && applicableIds.every((id) => current?.taskCardIds.has(id));

      if (applicableIds.length === 0) { next.delete(controlId); return next; }
      if (allSelected) next.delete(controlId);
      else next.set(controlId, { taskCardIds: new Set(applicableIds), description: current?.description ?? defaultDescription });
      return next;
    });
    clearDescriptionError(controlId);
  };

  const handleDescriptionChange = (controlId: number, description: string) => {
    setSelectedControls((prev) => {
      const current = prev.get(controlId);
      if (!current) return prev;
      const next = new Map(prev);
      next.set(controlId, { ...current, description });
      return next;
    });
    clearDescriptionError(controlId);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedAircraftId || !selectedCompany?.slug) return;

    // Validate descriptions
    const nextErrors = selectedControlEntries.reduce<Record<number, string>>((acc, entry) => {
      if (!entry.item.description.trim()) acc[entry.control.id] = 'La descripción es obligatoria.';
      return acc;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      setDescriptionErrors(nextErrors);
      return;
    }

    const payload: StoreWorkOrderRequest = {
      aircraft_id: selectedAircraftId,
      remarks: remarks.trim() || undefined,
      entry_date: entryDate || undefined,
      exit_date: exitDate || undefined,
      items: selectedControlEntries.map(({ control, item }) => ({
        description: item.description.trim(),
        maintenance_control_id: control.id,
        task_ids: Array.from(item.taskCardIds),
      })),
    };

    const res = await createWorkOrder.mutateAsync({ body: payload });
    router.push(`/${selectedCompany.slug}/planificacion/ordenes_trabajo/${res.data.order_number}`);
  }, [createWorkOrder, entryDate, exitDate, remarks, router, selectedAircraftId, selectedCompany, selectedControlEntries]);

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
    <div className="max-w-7xl space-y-6">
      {/* 1. Aircraft header — full width */}
      <AircraftHeader
        aircrafts={aircrafts ?? []}
        selectedAircraft={selectedAircraft}
        onSelect={handleSelectAircraft}
        onClear={handleClearAircraft}
      />

      {selectedAircraft && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-8">
            {/* 2. Work order data */}
            <div className="rounded-lg border bg-background">
              <div className="border-b px-5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Datos de la Orden
                </span>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="wo-entry-date" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <CalendarDays className="size-3" />
                    Fecha de entrada
                  </label>
                  <Input
                    id="wo-entry-date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="bg-muted/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="wo-exit-date" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <CalendarDays className="size-3" />
                    Fecha de salida
                  </label>
                  <Input
                    id="wo-exit-date"
                    type="date"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className="bg-muted/20"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="wo-remarks" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <MessageSquareText className="size-3" />
                    Observaciones
                  </label>
                  <Textarea
                    id="wo-remarks"
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Observaciones operativas, restricciones o instrucciones…"
                    className="bg-muted/20"
                  />
                </div>
              </div>
            </div>

            {/* 3. Controls selection */}
            <ControlsList
              controls={controls}
              selectedControls={selectedControls}
              isLoading={isControlsLoading}
              descriptionErrors={descriptionErrors}
              onToggleTaskCard={handleToggleTaskCard}
              onToggleAllTaskCards={handleToggleAllTaskCards}
              onDescriptionChange={handleDescriptionChange}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <SelectionSummary
              controls={controls}
              selectedControls={selectedControls}
              totalTaskCards={totalSelectedTaskCards}
              onSubmit={handleSubmit}
              isSubmitting={createWorkOrder.isPending}
              onCancel={() => router.push(`/${selectedCompany!.slug}/planificacion/ordenes_trabajo`)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderCreator;
