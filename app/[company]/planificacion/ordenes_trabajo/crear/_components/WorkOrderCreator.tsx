'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { aircraftComponentSlotIndexOptions, maintenanceControlsIndexOptions } from '@api/queries';
import {
  AircraftComponentSlotResource,
  AircraftResource,
  HardTimeIntervalResource,
  MaintenanceControlResource,
  StoreWorkOrderRequest,
  TaskCardResource,
} from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, ClipboardCheck, MessageSquareText, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateWorkOrder } from '@/actions/planificacion/ordenes_trabajo/actions';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import AircraftHeader from './AircraftHeader';
import ControlsList from './ControlsList';
import HardTimeControlsList from './HardTimeControlsList';
import SelectionSummary from './SelectionSummary';

export type SelectedControlItem = {
  taskCardIds: Set<number>;
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
  const [selectedHardTimeIntervals, setSelectedHardTimeIntervals] = useState<Set<number>>(new Set());
  const [remarks, setRemarks] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [activeTab, setActiveTab] = useState<'maintenance' | 'hard_time'>('maintenance');

  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: { aircraft_id: selectedAircraftId ?? undefined },
    }),
    enabled: !!selectedAircraftId,
  });

  const { data: slotsResponse, isLoading: isSlotsLoading } = useQuery({
    ...aircraftComponentSlotIndexOptions({
      query: { aircraft_id: selectedAircraftId ?? undefined },
    }),
    enabled: !!selectedAircraftId,
  });

  const controls = useMemo<MaintenanceControlResource[]>(() => controlsResponse?.data ?? [], [controlsResponse]);
  const slots = useMemo<AircraftComponentSlotResource[]>(() => slotsResponse?.data ?? [], [slotsResponse]);

  const hardTimeIntervalDirectory = useMemo(() => {
    const map = new Map<
      number,
      { interval: HardTimeIntervalResource; slot: AircraftComponentSlotResource }
    >();
    for (const slot of slots) {
      const intervals = slot.installed_part?.intervals ?? [];
      for (const interval of intervals) {
        if (interval.is_active === false) continue;
        map.set(interval.id, { interval, slot });
      }
    }
    return map;
  }, [slots]);

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

  // Drop hard-time intervals that no longer exist for the aircraft
  useEffect(() => {
    setSelectedHardTimeIntervals((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set<number>();
      prev.forEach((id) => {
        if (hardTimeIntervalDirectory.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [hardTimeIntervalDirectory]);

  const resetSelection = () => {
    setSelectedControls(new Map());
    setSelectedHardTimeIntervals(new Set());
    setRemarks('');
    setEntryDate('');
    setExitDate('');
    setActiveTab('maintenance');
  };

  const handleSelectAircraft = (aircraft: AircraftResource) => {
    setSelectedAircraftId(aircraft.id);
    resetSelection();
  };

  const handleClearAircraft = () => {
    setSelectedAircraftId(null);
    resetSelection();
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
        else next.set(controlId, { taskCardIds: nextIds });
      } else {
        nextIds.add(taskCardId);
        next.set(controlId, { taskCardIds: nextIds });
      }
      return next;
    });
  };

  const handleToggleAllTaskCards = (controlId: number, taskCards: TaskCardResource[]) => {
    setSelectedControls((prev) => {
      const next = new Map(prev);
      const current = next.get(controlId);
      const applicableIds = taskCards.filter((tc) => tc.applicable).map((tc) => tc.id);
      const allSelected = applicableIds.length > 0 && applicableIds.every((id) => current?.taskCardIds.has(id));

      if (applicableIds.length === 0) {
        next.delete(controlId);
        return next;
      }

      if (allSelected) next.delete(controlId);
      else next.set(controlId, { taskCardIds: new Set(applicableIds) });
      return next;
    });
  };

  const handleToggleHardTimeInterval = (intervalId: number) => {
    setSelectedHardTimeIntervals((prev) => {
      const next = new Set(prev);
      if (next.has(intervalId)) next.delete(intervalId);
      else next.add(intervalId);
      return next;
    });
  };

  const handleToggleHardTimeGroup = (intervalIds: number[]) => {
    setSelectedHardTimeIntervals((prev) => {
      const allSelected = intervalIds.length > 0 && intervalIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) intervalIds.forEach((id) => next.delete(id));
      else intervalIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedAircraftId || !selectedCompany?.slug) return;

    const maintenanceItems = selectedControlEntries.map(({ control, item }) => ({
      maintenance_control_id: control.id,
      task_ids: Array.from(item.taskCardIds),
    }));

    const hardTimeItems = Array.from(selectedHardTimeIntervals).map((id) => ({
      hard_time_interval_id: id,
    }));

    const payload = {
      aircraft_id: selectedAircraftId,
      remarks: remarks.trim() || undefined,
      entry_date: entryDate || undefined,
      exit_date: exitDate || undefined,
      maintenance_items: maintenanceItems,
      hard_time_items: hardTimeItems,
    } as unknown as StoreWorkOrderRequest;

    const res = await createWorkOrder.mutateAsync({ body: payload });
    router.push(`/${selectedCompany.slug}/planificacion/ordenes_trabajo/${res.data.order_number}`);
  }, [
    createWorkOrder,
    entryDate,
    exitDate,
    remarks,
    router,
    selectedAircraftId,
    selectedCompany,
    selectedControlEntries,
    selectedHardTimeIntervals,
  ]);

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

            {/* 3. Controls selection — tabs between maintenance and hard time */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
                <TabsTrigger value="maintenance" className="gap-2 data-[state=active]:bg-background">
                  <ClipboardCheck className="size-3.5" />
                  Servicios Programados
                  {selectedControlEntries.length > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-1 h-5 border-sky-500/30 bg-sky-500/10 px-1.5 text-[10px] tabular-nums text-sky-600 dark:text-sky-400',
                      )}
                    >
                      {selectedControlEntries.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="hard_time" className="gap-2 data-[state=active]:bg-background">
                  <ShieldAlert className="size-3.5" />
                  Servicios - Componentes
                  {selectedHardTimeIntervals.size > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-1 h-5 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] tabular-nums text-amber-600 dark:text-amber-400"
                    >
                      {selectedHardTimeIntervals.size}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="maintenance" className="mt-0">
                <ControlsList
                  controls={controls}
                  selectedControls={selectedControls}
                  isLoading={isControlsLoading}
                  onToggleTaskCard={handleToggleTaskCard}
                  onToggleAllTaskCards={handleToggleAllTaskCards}
                />
              </TabsContent>

              <TabsContent value="hard_time" className="mt-0">
                <HardTimeControlsList
                  slots={slots}
                  aircraftFlightHours={selectedAircraft?.flight_hours ?? null}
                  aircraftFlightCycles={selectedAircraft?.flight_cycles ?? null}
                  selectedIntervalIds={selectedHardTimeIntervals}
                  onToggleInterval={handleToggleHardTimeInterval}
                  onToggleGroup={handleToggleHardTimeGroup}
                  isLoading={isSlotsLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <SelectionSummary
              controls={controls}
              selectedControls={selectedControls}
              totalTaskCards={totalSelectedTaskCards}
              hardTimeIntervalDirectory={hardTimeIntervalDirectory}
              selectedHardTimeIntervals={selectedHardTimeIntervals}
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
