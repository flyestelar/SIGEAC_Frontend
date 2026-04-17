'use client';

import { workOrdersIndexOptions } from '@api/queries';
import { AircraftResource, WorkOrderResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { startTransition, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardCheck, ClipboardList, Link2, Loader2, Plus, SearchCheck, Wrench } from 'lucide-react';

import {
  useCreateHardTimeComponent,
  useCreateHardTimeInterval,
  useInstallHardTimeComponent,
  useRegisterHardTimeCompliance,
  useToggleHardTimeInterval,
  useUninstallHardTimeComponent,
  useUpdateHardTimeInterval,
} from '@/actions/planificacion/hard_time/actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetHardTimeCategories } from '@/hooks/planificacion/hard_time/useGetHardTimeCategories';
import { useGetHardTimeComponentDetail } from '@/hooks/planificacion/hard_time/useGetHardTimeComponentDetail';
import { useGetHardTimeComponents } from '@/hooks/planificacion/hard_time/useGetHardTimeComponents';
import { useCompanyStore } from '@/stores/CompanyStore';
import {
  HardTimeCategory,
  HardTimeCreateComponentData,
  HardTimeCreateIntervalData,
  HardTimeInstallComponentData,
  HardTimeInterval,
  HardTimeRegisterComplianceData,
  HardTimeUninstallComponentData,
} from '@/types';
import { AircraftAverageSummaryCard } from '../../control_mantenimiento/_components/aircraft-average-summary-card';
import { AircraftSelector } from '../../control_mantenimiento/_components/aircraft-selector';
import { HardTimeCardView } from './hard-time-card-view';
import { AlertBadge } from './hard-time-shared';

type ComponentFormState = {
  category_code: string;
  part_number: string;
  description: string;
  position: string;
  ata_chapter: string;
};

type InstallFormState = {
  serial_number: string;
  part_number: string;
  article_id: string;
  installed_at: string;
  aircraft_hours_at_install: string;
  aircraft_cycles_at_install: string;
  component_hours_at_install: string;
  component_cycles_at_install: string;
  is_manual_entry: 'true' | 'false';
};

type UninstallFormState = {
  removed_at: string;
  aircraft_hours_at_removal: string;
  aircraft_cycles_at_removal: string;
  removal_reason: string;
  remarks: string;
};

type IntervalFormState = {
  task_description: string;
  interval_hours: string;
  interval_cycles: string;
  interval_days: string;
};

type ComplianceFormState = {
  hard_time_interval_id: string;
  work_order_id: string;
  compliance_date: string;
  aircraft_hours_at_compliance: string;
  aircraft_cycles_at_compliance: string;
  remarks: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy', { locale: es });
}

function formatNumber(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  return Number(value);
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) return null;
  return Number.parseInt(value, 10);
}

function SectionEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-border/70">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="rounded-full border border-border/60 bg-muted/30 p-3">
          <AlertCircle className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

function IntervalStatusAction({
  interval,
  componentId,
  aircraftId,
}: {
  interval: HardTimeInterval;
  componentId: number;
  aircraftId: number | null;
}) {
  const toggleInterval = useToggleHardTimeInterval(interval.id, componentId, aircraftId);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8"
      onClick={() => toggleInterval.mutate()}
      disabled={toggleInterval.isPending}
    >
      {toggleInterval.isPending && <Loader2 className="mr-1 size-3 animate-spin" />}
      {interval.is_active ? 'Desactivar' : 'Activar'}
    </Button>
  );
}

function CreateComponentDialog({
  open,
  onOpenChange,
  aircraftId,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: number | null;
  categories: HardTimeCategory[];
}) {
  const createComponent = useCreateHardTimeComponent(aircraftId);
  const [form, setForm] = useState<ComponentFormState>({
    category_code: '',
    part_number: '',
    description: '',
    position: '',
    ata_chapter: '',
  });

  useEffect(() => {
    if (!open) {
      setForm({
        category_code: '',
        part_number: '',
        description: '',
        position: '',
        ata_chapter: '',
      });
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!aircraftId) return;

    const payload: HardTimeCreateComponentData = {
      aircraft_id: aircraftId,
      category_code: form.category_code,
      part_number: form.part_number.trim(),
      description: form.description.trim(),
      position: form.position.trim(),
      ata_chapter: form.ata_chapter.trim() || undefined,
    };

    await createComponent.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva posición Hard Time</DialogTitle>
          <DialogDescription>Registra posición controlada dentro de aeronave seleccionada.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select
              value={form.category_code}
              onValueChange={(value) => setForm((current) => ({ ...current, category_code: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.name} ({category.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Part Number</label>
              <Input
                value={form.part_number}
                onChange={(event) => setForm((current) => ({ ...current, part_number: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Posición</label>
              <Input
                value={form.position}
                onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                placeholder="ENG-1-FP"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <Input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Capítulo ATA</label>
            <Input
              value={form.ata_chapter}
              onChange={(event) => setForm((current) => ({ ...current, ata_chapter: event.target.value }))}
              placeholder="72"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!aircraftId || !form.category_code || createComponent.isPending}
            >
              {createComponent.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear posición
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InstallComponentDialog({
  open,
  onOpenChange,
  componentId,
  aircraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: number | null;
  aircraft: AircraftResource | null;
}) {
  const installComponent = useInstallHardTimeComponent(componentId ?? 0, aircraft?.id ?? null);
  const [form, setForm] = useState<InstallFormState>({
    serial_number: '',
    part_number: '',
    article_id: '',
    installed_at: todayDate(),
    aircraft_hours_at_install: String(aircraft?.flight_hours ?? 0),
    aircraft_cycles_at_install: String(aircraft?.flight_cycles ?? 0),
    component_hours_at_install: '0',
    component_cycles_at_install: '0',
    is_manual_entry: 'true',
  });

  useEffect(() => {
    if (open) {
      setForm((current) => ({
        ...current,
        installed_at: todayDate(),
        aircraft_hours_at_install: String(aircraft?.flight_hours ?? 0),
        aircraft_cycles_at_install: String(aircraft?.flight_cycles ?? 0),
      }));
    }
  }, [aircraft, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!componentId) return;

    const payload: HardTimeInstallComponentData = {
      serial_number: form.serial_number.trim(),
      part_number: form.part_number.trim(),
      article_id: parseOptionalInteger(form.article_id) ?? undefined,
      installed_at: form.installed_at,
      aircraft_hours_at_install: Number(form.aircraft_hours_at_install),
      aircraft_cycles_at_install: Number(form.aircraft_cycles_at_install),
      component_hours_at_install: Number(form.component_hours_at_install),
      component_cycles_at_install: Number(form.component_cycles_at_install),
      is_manual_entry: form.is_manual_entry === 'true',
    };

    await installComponent.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Montar componente</DialogTitle>
          <DialogDescription>Registra montaje para posición seleccionada.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <Input
                value={form.serial_number}
                onChange={(event) => setForm((current) => ({ ...current, serial_number: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Part Number</label>
              <Input
                value={form.part_number}
                onChange={(event) => setForm((current) => ({ ...current, part_number: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha montaje</label>
              <Input
                type="date"
                value={form.installed_at}
                onChange={(event) => setForm((current) => ({ ...current, installed_at: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Origen</label>
              <Select
                value={form.is_manual_entry}
                onValueChange={(value: 'true' | 'false') =>
                  setForm((current) => ({ ...current, is_manual_entry: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Manual</SelectItem>
                  <SelectItem value="false">Desde almacén</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">FH aeronave al montar</label>
              <Input
                type="number"
                step="0.01"
                value={form.aircraft_hours_at_install}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aircraft_hours_at_install: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FC aeronave al montar</label>
              <Input
                type="number"
                value={form.aircraft_cycles_at_install}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aircraft_cycles_at_install: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">FH componente al montar</label>
              <Input
                type="number"
                step="0.01"
                value={form.component_hours_at_install}
                onChange={(event) =>
                  setForm((current) => ({ ...current, component_hours_at_install: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FC componente al montar</label>
              <Input
                type="number"
                value={form.component_cycles_at_install}
                onChange={(event) =>
                  setForm((current) => ({ ...current, component_cycles_at_install: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ID artículo almacén</label>
            <Input
              type="number"
              value={form.article_id}
              onChange={(event) => setForm((current) => ({ ...current, article_id: event.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!componentId || installComponent.isPending}>
              {installComponent.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Montar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UninstallComponentDialog({
  open,
  onOpenChange,
  componentId,
  aircraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: number | null;
  aircraft: AircraftResource | null;
}) {
  const uninstallComponent = useUninstallHardTimeComponent(componentId ?? 0, aircraft?.id ?? null);
  const [form, setForm] = useState<UninstallFormState>({
    removed_at: todayDate(),
    aircraft_hours_at_removal: String(aircraft?.flight_hours ?? 0),
    aircraft_cycles_at_removal: String(aircraft?.flight_cycles ?? 0),
    removal_reason: '',
    remarks: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        removed_at: todayDate(),
        aircraft_hours_at_removal: String(aircraft?.flight_hours ?? 0),
        aircraft_cycles_at_removal: String(aircraft?.flight_cycles ?? 0),
        removal_reason: '',
        remarks: '',
      });
    }
  }, [aircraft, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!componentId) return;

    const payload: HardTimeUninstallComponentData = {
      removed_at: form.removed_at,
      aircraft_hours_at_removal: Number(form.aircraft_hours_at_removal),
      aircraft_cycles_at_removal: Number(form.aircraft_cycles_at_removal),
      removal_reason: form.removal_reason.trim(),
      remarks: form.remarks.trim() || undefined,
    };

    await uninstallComponent.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desmontar componente</DialogTitle>
          <DialogDescription>Cierra instalación activa de posición seleccionada.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha desmontaje</label>
              <Input
                type="date"
                value={form.removed_at}
                onChange={(event) => setForm((current) => ({ ...current, removed_at: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Razón</label>
              <Input
                value={form.removal_reason}
                onChange={(event) => setForm((current) => ({ ...current, removal_reason: event.target.value }))}
                placeholder="Hard Time, Defecto, Oportunidad"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">FH aeronave al desmontar</label>
              <Input
                type="number"
                step="0.01"
                value={form.aircraft_hours_at_removal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aircraft_hours_at_removal: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FC aeronave al desmontar</label>
              <Input
                type="number"
                value={form.aircraft_cycles_at_removal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aircraft_cycles_at_removal: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Textarea
              value={form.remarks}
              onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!componentId || uninstallComponent.isPending}>
              {uninstallComponent.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Desmontar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IntervalDialog({
  open,
  onOpenChange,
  componentId,
  aircraftId,
  interval,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: number | null;
  aircraftId: number | null;
  interval: HardTimeInterval | null;
}) {
  const createInterval = useCreateHardTimeInterval(componentId ?? 0, aircraftId);
  const updateInterval = useUpdateHardTimeInterval(interval?.id ?? 0, componentId ?? 0, aircraftId);
  const [form, setForm] = useState<IntervalFormState>({
    task_description: '',
    interval_hours: '',
    interval_cycles: '',
    interval_days: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      task_description: interval?.task_description ?? '',
      interval_hours: interval?.interval_hours?.toString() ?? '',
      interval_cycles: interval?.interval_cycles?.toString() ?? '',
      interval_days: interval?.interval_days?.toString() ?? '',
    });
  }, [interval, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!componentId) return;

    const payload: HardTimeCreateIntervalData = {
      task_description: form.task_description.trim(),
      interval_hours: parseOptionalNumber(form.interval_hours),
      interval_cycles: parseOptionalInteger(form.interval_cycles),
      interval_days: parseOptionalInteger(form.interval_days),
    };

    if (interval) {
      await updateInterval.mutateAsync(payload);
    } else {
      await createInterval.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const isPending = createInterval.isPending || updateInterval.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{interval ? 'Editar intervalo' : 'Nuevo intervalo'}</DialogTitle>
          <DialogDescription>Configura vencimiento por horas, ciclos o calendario.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tarea</label>
            <Input
              value={form.task_description}
              onChange={(event) => setForm((current) => ({ ...current, task_description: event.target.value }))}
              placeholder="Overhaul"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo FH</label>
              <Input
                type="number"
                step="0.01"
                value={form.interval_hours}
                onChange={(event) => setForm((current) => ({ ...current, interval_hours: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo FC</label>
              <Input
                type="number"
                value={form.interval_cycles}
                onChange={(event) => setForm((current) => ({ ...current, interval_cycles: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo días</label>
              <Input
                type="number"
                value={form.interval_days}
                onChange={(event) => setForm((current) => ({ ...current, interval_days: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!componentId || isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ComplianceDialog({
  open,
  onOpenChange,
  componentId,
  aircraft,
  intervals,
  workOrders,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: number | null;
  aircraft: AircraftResource | null;
  intervals: HardTimeInterval[];
  workOrders: WorkOrderResource[];
}) {
  const registerCompliance = useRegisterHardTimeCompliance(componentId ?? 0, aircraft?.id ?? null);
  const [form, setForm] = useState<ComplianceFormState>({
    hard_time_interval_id: '',
    work_order_id: '',
    compliance_date: todayDate(),
    aircraft_hours_at_compliance: String(aircraft?.flight_hours ?? 0),
    aircraft_cycles_at_compliance: String(aircraft?.flight_cycles ?? 0),
    remarks: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        hard_time_interval_id: intervals.find((interval) => interval.is_active)?.id?.toString() ?? '',
        work_order_id: '',
        compliance_date: todayDate(),
        aircraft_hours_at_compliance: String(aircraft?.flight_hours ?? 0),
        aircraft_cycles_at_compliance: String(aircraft?.flight_cycles ?? 0),
        remarks: '',
      });
    }
  }, [aircraft, intervals, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!componentId) return;

    const payload: HardTimeRegisterComplianceData = {
      hard_time_interval_id: Number(form.hard_time_interval_id),
      work_order_id: Number(form.work_order_id),
      compliance_date: form.compliance_date,
      aircraft_hours_at_compliance: Number(form.aircraft_hours_at_compliance),
      aircraft_cycles_at_compliance: Number(form.aircraft_cycles_at_compliance),
      remarks: form.remarks.trim() || undefined,
    };

    await registerCompliance.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar cumplimiento</DialogTitle>
          <DialogDescription>Asocia cumplimiento con intervalo y orden de trabajo.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo</label>
              <Select
                value={form.hard_time_interval_id}
                onValueChange={(value) => setForm((current) => ({ ...current, hard_time_interval_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona intervalo" />
                </SelectTrigger>
                <SelectContent>
                  {intervals
                    .filter((interval) => interval.is_active)
                    .map((interval) => (
                      <SelectItem key={interval.id} value={String(interval.id)}>
                        {interval.task_description}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Orden de trabajo</label>
              <Select
                value={form.work_order_id}
                onValueChange={(value) => setForm((current) => ({ ...current, work_order_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona OT" />
                </SelectTrigger>
                <SelectContent>
                  {workOrders.map((workOrder) => (
                    <SelectItem key={workOrder.id} value={String(workOrder.id)}>
                      {workOrder.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                value={form.compliance_date}
                onChange={(event) => setForm((current) => ({ ...current, compliance_date: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FH aeronave</label>
              <Input
                type="number"
                step="0.01"
                value={form.aircraft_hours_at_compliance}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aircraft_hours_at_compliance: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FC aeronave</label>
              <Input
                type="number"
                value={form.aircraft_cycles_at_compliance}
                onChange={(event) =>
                  setForm((current) => ({ ...current, aircraft_cycles_at_compliance: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones</label>
            <Textarea
              value={form.remarks}
              onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !componentId ||
                !form.hard_time_interval_id ||
                !form.work_order_id ||
                registerCompliance.isPending
              }
            >
              {registerCompliance.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HardTimeDashboard() {
  const { selectedCompany } = useCompanyStore();
  const [selectedAircraftId, setSelectedAircraftId] = useState<number | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [isCreateComponentOpen, setIsCreateComponentOpen] = useState(false);
  const [installingComponentId, setInstallingComponentId] = useState<number | null>(null);
  const [uninstallingComponentId, setUninstallingComponentId] = useState<number | null>(null);
  const [isIntervalDialogOpen, setIsIntervalDialogOpen] = useState(false);
  const [editingInterval, setEditingInterval] = useState<HardTimeInterval | null>(null);
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);

  const { data: aircraft = [], isLoading: isAircraftLoading } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: categories = [] } = useGetHardTimeCategories();
  const { data: groupsResponse, isLoading: isComponentsLoading, isError: isComponentsError } =
    useGetHardTimeComponents(selectedAircraftId);
  const { data: selectedComponentDetail, isFetching: isDetailFetching } = useGetHardTimeComponentDetail(
    selectedComponentId,
    selectedAircraftId,
  );

  const selectedAircraft = useMemo(
    () => aircraft.find((item) => item.id === selectedAircraftId) ?? null,
    [aircraft, selectedAircraftId],
  );

  const categoryGroups = useMemo(() => groupsResponse?.data ?? [], [groupsResponse]);

  const allComponents = useMemo(
    () => categoryGroups.flatMap((group) => group.components),
    [categoryGroups],
  );

  const selectedComponentCard = useMemo(
    () => allComponents.find((component) => component.id === selectedComponentId) ?? null,
    [allComponents, selectedComponentId],
  );

  useEffect(() => {
    if (!selectedComponentId) return;
    if (allComponents.some((component) => component.id === selectedComponentId)) return;
    setSelectedComponentId(null);
  }, [allComponents, selectedComponentId]);

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
    setSelectedComponentId(componentId);
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
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/${selectedCompany?.slug}/planificacion/hard_time/trazabilidad`}>
                  <SearchCheck className="size-4" />
                  Trazabilidad
                </Link>
              </Button>
              <Button
                className="gap-2"
                onClick={() => setIsCreateComponentOpen(true)}
                disabled={!selectedAircraftId}
              >
                <Plus className="size-4" />
                Nueva posición
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
              description="Escoge aeronave para cargar posiciones controladas, intervalos y cumplimientos Hard Time."
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
                  description="Aeronave aún no tiene posiciones Hard Time registradas."
                  action={
                    <Button onClick={() => setIsCreateComponentOpen(true)} className="gap-2">
                      <Plus className="size-4" />
                      Crear primera posición
                    </Button>
                  }
                />
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={categoryGroups.map((group) => group.category.code)}
                  className="space-y-3"
                >
                  {categoryGroups.map((group) => (
                    <AccordionItem
                      key={group.category.code}
                      value={group.category.code}
                      className="overflow-hidden rounded-xl border border-border/60 bg-card"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex w-full items-center justify-between gap-4 pr-2 text-left">
                          <div>
                            <p className="text-sm font-semibold">{group.category.name}</p>
                            <p className="text-xs text-muted-foreground">{group.category.code}</p>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">
                            {group.components.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-border/50 px-4 py-4">
                        <HardTimeCardView
                          components={group.components}
                          onSelectComponent={handleSelectComponent}
                          averageDailyFH={averages?.average_daily_flight_hours ?? null}
                          averageDailyFC={averages?.average_daily_flight_cycles ?? null}
                          onInstallComponent={openInstall}
                          onUninstallComponent={openUninstall}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {selectedComponentCard && (
                <Card className="border-border/60">
                  <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {selectedComponentCard.position}
                          </Badge>
                          <AlertBadge status={selectedComponentCard.status} size="medium" />
                          {isDetailFetching && (
                            <Badge variant="outline" className="gap-1">
                              <Loader2 className="size-3 animate-spin" />
                              Actualizando
                            </Badge>
                          )}
                        </div>
                        <div>
                          <CardTitle>{selectedComponentCard.description}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            P/N {selectedComponentCard.active_installation?.part_number ?? selectedComponentCard.part_number}
                            {selectedComponentCard.active_installation?.serial_number
                              ? ` · S/N ${selectedComponentCard.active_installation.serial_number}`
                              : ' · Vacante'}
                            {selectedComponentCard.ata_chapter ? ` · ATA ${selectedComponentCard.ata_chapter}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setEditingInterval(null);
                            setIsIntervalDialogOpen(true);
                          }}
                        >
                          <ClipboardList className="size-4" />
                          Intervalo
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => setIsComplianceDialogOpen(true)}
                          disabled={!selectedComponentDetail?.active_installation}
                        >
                          <ClipboardCheck className="size-4" />
                          Cumplimiento
                        </Button>
                        {selectedComponentCard.active_installation ? (
                          <Button variant="outline" className="gap-2" onClick={() => openUninstall(selectedComponentCard.id)}>
                            <Link2 className="size-4" />
                            Desmontar
                          </Button>
                        ) : (
                          <Button variant="outline" className="gap-2" onClick={() => openInstall(selectedComponentCard.id)}>
                            <Link2 className="size-4" />
                            Montar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {selectedComponentDetail ? (
                      <Tabs defaultValue="intervalos" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="intervalos">Intervalos</TabsTrigger>
                          <TabsTrigger value="cumplimientos">Cumplimientos</TabsTrigger>
                          <TabsTrigger value="historial">Historial</TabsTrigger>
                        </TabsList>

                        <TabsContent value="intervalos">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Tarea</TableHead>
                                <TableHead>Intervalos</TableHead>
                                <TableHead>Último cumplimiento</TableHead>
                                <TableHead>Próximo vencimiento</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedComponentDetail.intervals.map((interval) => (
                                <TableRow key={interval.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{interval.task_description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {interval.is_active ? 'Activo' : 'Inactivo'}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    <div>FH: {formatNumber(interval.interval_hours, 2)}</div>
                                    <div>FC: {formatNumber(interval.interval_cycles, 0)}</div>
                                    <div>Días: {formatNumber(interval.interval_days, 0)}</div>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {interval.last_compliance ? (
                                      <div>
                                        <div>{formatDate(interval.last_compliance.compliance_date)}</div>
                                        <div className="font-mono">
                                          OT {interval.last_compliance.work_order?.order_number ?? '—'}
                                        </div>
                                      </div>
                                    ) : (
                                      'Sin registro'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {interval.last_compliance ? (
                                      <div>
                                        <div>FH: {formatNumber(interval.last_compliance.next_due_hours, 2)}</div>
                                        <div>FC: {formatNumber(interval.last_compliance.next_due_cycles, 0)}</div>
                                        <div>{formatDate(interval.last_compliance.next_due_date)}</div>
                                      </div>
                                    ) : (
                                      'Desde instalación'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <AlertBadge status={interval.status ?? 'OK'} />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8"
                                        onClick={() => {
                                          setEditingInterval(interval);
                                          setIsIntervalDialogOpen(true);
                                        }}
                                      >
                                        Editar
                                      </Button>
                                      <IntervalStatusAction
                                        interval={interval}
                                        componentId={selectedComponentDetail.id}
                                        aircraftId={selectedAircraftId}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="cumplimientos">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Intervalo</TableHead>
                                <TableHead>FH / FC</TableHead>
                                <TableHead>OT</TableHead>
                                <TableHead>Observaciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedComponentDetail.compliances.length > 0 ? (
                                selectedComponentDetail.compliances.map((compliance) => {
                                  const interval = selectedComponentDetail.intervals.find(
                                    (item) => item.id === compliance.hard_time_interval_id,
                                  );

                                  return (
                                    <TableRow key={compliance.id}>
                                      <TableCell>{formatDate(compliance.compliance_date)}</TableCell>
                                      <TableCell>{interval?.task_description ?? '—'}</TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {formatNumber(compliance.aircraft_hours_at_compliance, 2)} /{' '}
                                        {formatNumber(compliance.aircraft_cycles_at_compliance, 0)}
                                      </TableCell>
                                      <TableCell className="font-mono">
                                        {compliance.work_order?.order_number ?? '—'}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {compliance.remarks || '—'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    Sin cumplimientos registrados.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="historial">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>S/N</TableHead>
                                <TableHead>P/N</TableHead>
                                <TableHead>Montado</TableHead>
                                <TableHead>Desmontado</TableHead>
                                <TableHead>FH / FC inicial</TableHead>
                                <TableHead>Motivo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedComponentDetail.installations.length > 0 ? (
                                selectedComponentDetail.installations.map((installation) => (
                                  <TableRow key={installation.id}>
                                    <TableCell className="font-mono">{installation.serial_number}</TableCell>
                                    <TableCell className="font-mono">{installation.part_number}</TableCell>
                                    <TableCell>{formatDate(installation.installed_at)}</TableCell>
                                    <TableCell>{formatDate(installation.removed_at)}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {formatNumber(installation.component_hours_at_install, 2)} /{' '}
                                      {formatNumber(installation.component_cycles_at_install, 0)}
                                    </TableCell>
                                    <TableCell>{installation.removal_reason || 'Activa'}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Sin historial disponible.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                        Selecciona componente para ver detalle.
                      </div>
                    )}
                  </CardContent>
                </Card>
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

      <InstallComponentDialog
        open={installingComponentId !== null}
        onOpenChange={(open) => {
          if (!open) setInstallingComponentId(null);
        }}
        componentId={installingComponentId}
        aircraft={selectedAircraft}
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
