'use client';

import { AircraftResource } from '@api/types';
import { useInstallHardTimeComponent } from '@/actions/planificacion/hard_time/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetBatchesWithInWarehouseArticles } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesWithInWarehouseArticles';
import axios from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import {
  AlertCircle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PackageCheck,
  PenLine,
  Plane,
  Plug2,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type InstallSourceMode = 'warehouse' | 'manual';

type ManualDraft = {
  serial_number: string;
  part_number: string;
  installed_at: string;
  component_hours_at_install: string;
  component_cycles_at_install: string;
};

type WarehouseDraft = ManualDraft & {
  article_id: string;
};

type WarehouseRow = {
  article_id: number;
  serial: string;
  part_number: string;
  batch_name: string;
  batch_slug: string;
  status?: string;
  description?: string;
  hour_date?: number | null;
  cycle_date?: number | null;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumericInput(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return String(value);
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) return null;
  return Number.parseInt(value, 10);
}

function parseRequiredNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchWarehouseArticleHardTime({
  company,
  locationId,
  batchSlug,
  serial,
}: {
  company: string;
  locationId: string;
  batchSlug: string;
  serial: string;
}) {
  const { data } = await axios.post(`/${company}/articles/${batchSlug}/${serial}`, {
    location_id: locationId,
  });

  return data as {
    hard_time?: {
      hour_date?: number | null;
      cycle_date?: number | null;
    };
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

function SourceTab({
  active,
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: typeof Boxes;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-sky-500 text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <Icon className={cn('size-4', active ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground')} />
      {label}
    </button>
  );
}

function ConfirmationField({
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  required = false,
  disabled = false,
  step,
  mono = false,
}: {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  step?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>
        {label}
        {required ? <span className="ml-1 text-sky-600 dark:text-sky-400">*</span> : null}
      </FieldLabel>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        step={step}
        className={cn('h-9', mono && 'font-mono')}
      />
    </div>
  );
}

function WarehouseTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[1.1fr_1fr_1fr_0.6fr_0.6fr] gap-3 px-4 py-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function InstallComponentDialog({
  open,
  onOpenChange,
  componentId,
  aircraft,
  defaultPartNumber,
  slotLabel,
  componentLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: number | null;
  aircraft: AircraftResource | null;
  defaultPartNumber?: string;
  slotLabel?: string;
  componentLabel?: string;
}) {
  const { selectedCompany, selectedStation } = useCompanyStore();
  const installComponent = useInstallHardTimeComponent(componentId ?? 0, aircraft?.id ?? null);
  const {
    data: warehouseBatches,
    isLoading: isWarehouseLoading,
    isError: isWarehouseError,
  } = useGetBatchesWithInWarehouseArticles('COMPONENTE');

  const [sourceMode, setSourceMode] = useState<InstallSourceMode>('warehouse');
  const [search, setSearch] = useState('');
  const [warehouseErrorMessage, setWarehouseErrorMessage] = useState<string | null>(null);
  const [selectedWarehouseArticleId, setSelectedWarehouseArticleId] = useState<number | null>(null);
  const wasOpenRef = useRef(false);
  const [manualDraft, setManualDraft] = useState<ManualDraft>({
    serial_number: '',
    part_number: defaultPartNumber ?? '',
    installed_at: todayDate(),
    component_hours_at_install: '0',
    component_cycles_at_install: '0',
  });
  const [warehouseDraft, setWarehouseDraft] = useState<WarehouseDraft>({
    article_id: '',
    serial_number: '',
    part_number: defaultPartNumber ?? '',
    installed_at: todayDate(),
    component_hours_at_install: '0',
    component_cycles_at_install: '0',
  });

  const warehouseRows = useMemo<WarehouseRow[]>(() => {
    return (warehouseBatches ?? [])
      .filter((batch) => batch.category === 'COMPONENTE' || !batch.category)
      .flatMap((batch) =>
        batch.articles
          .filter((article) => Boolean(article.serial))
          .map((article) => ({
            article_id: article.id,
            serial: article.serial ?? '',
            part_number: article.part_number,
            batch_name: batch.name,
            batch_slug: batch.slug,
            status: (article as { status?: string }).status,
            description: (article as { description?: string }).description,
            hour_date: (article as { hour_date?: number | null }).hour_date ?? null,
            cycle_date: (article as { cycle_date?: number | null }).cycle_date ?? null,
          })),
      );
  }, [warehouseBatches]);

  const filteredWarehouseRows = useMemo(() => {
    if (!search.trim()) return warehouseRows;
    const query = search.toLowerCase();
    return warehouseRows.filter((row) =>
      [row.serial, row.part_number, row.batch_name, row.description].some((value) =>
        (value ?? '').toLowerCase().includes(query),
      ),
    );
  }, [search, warehouseRows]);

  const selectedWarehouseRow = useMemo(
    () => warehouseRows.find((row) => row.article_id === selectedWarehouseArticleId) ?? null,
    [selectedWarehouseArticleId, warehouseRows],
  );

  const activeDraft = sourceMode === 'manual' ? manualDraft : warehouseDraft;
  const warehouseHasRows = warehouseRows.length > 0;
  const isWarehouseMode = sourceMode === 'warehouse';

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    const nextManualDraft: ManualDraft = {
      serial_number: '',
      part_number: defaultPartNumber ?? '',
      installed_at: todayDate(),
      component_hours_at_install: '0',
      component_cycles_at_install: '0',
    };

    setManualDraft(nextManualDraft);
    setWarehouseDraft({
      article_id: '',
      serial_number: '',
      part_number: defaultPartNumber ?? '',
      installed_at: todayDate(),
      component_hours_at_install: '0',
      component_cycles_at_install: '0',
    });
    setSelectedWarehouseArticleId(null);
    setWarehouseErrorMessage(null);
    setSearch('');
    setSourceMode(warehouseHasRows ? 'warehouse' : 'manual');
  }, [defaultPartNumber, open, warehouseHasRows]);

  useEffect(() => {
    if (sourceMode === 'warehouse' && !warehouseHasRows && !isWarehouseLoading) {
      setSourceMode('manual');
    }
  }, [isWarehouseLoading, sourceMode, warehouseHasRows]);

  const handleWarehouseDetailFetch = async (row: WarehouseRow) => {
    setSelectedWarehouseArticleId(row.article_id);
    setWarehouseErrorMessage(null);

    setWarehouseDraft((current) => ({
      ...current,
      article_id: String(row.article_id),
      serial_number: row.serial,
      part_number: row.part_number || defaultPartNumber || '',
      component_hours_at_install: toNumericInput(row.hour_date),
      component_cycles_at_install: toNumericInput(row.cycle_date),
    }));

    if (!row.batch_slug || !row.serial || !selectedStation || !selectedCompany?.slug) return;

    try {
      const detail = await fetchWarehouseArticleHardTime({
        company: selectedCompany.slug,
        locationId: String(selectedStation),
        batchSlug: row.batch_slug,
        serial: row.serial,
      });
      const detailHours = detail.hard_time?.hour_date ?? row.hour_date ?? 0;
      const detailCycles = detail.hard_time?.cycle_date ?? row.cycle_date ?? 0;

      setWarehouseDraft((current) =>
        current.article_id === String(row.article_id)
          ? {
            ...current,
            component_hours_at_install: toNumericInput(detailHours),
            component_cycles_at_install: toNumericInput(detailCycles),
          }
          : current,
      );
    } catch {
      setWarehouseErrorMessage('No se pudieron cargar FH/FC del componente. Se inicializaron en 0.');
    }
  };

  const updateActiveDraft = (field: keyof ManualDraft | keyof WarehouseDraft, value: string) => {
    if (sourceMode === 'manual') {
      setManualDraft((current) => ({ ...current, [field]: value }));
      return;
    }

    setWarehouseDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!componentId) return;
    if (sourceMode === 'warehouse' && !warehouseDraft.article_id) return;

    await installComponent.mutateAsync({
      path: { id: componentId },
      body: {
        serial_number: activeDraft.serial_number.trim(),
        part_number: activeDraft.part_number.trim(),
        article_id:
          sourceMode === 'warehouse' ? parseOptionalInteger(warehouseDraft.article_id) ?? undefined : undefined,
        installed_at: activeDraft.installed_at,
        component_hours_at_install: parseRequiredNumber(activeDraft.component_hours_at_install),
        component_cycles_at_install: parseRequiredNumber(activeDraft.component_cycles_at_install),
        is_manual_entry: sourceMode === 'manual',
      },
    });
    onOpenChange(false);
  };

  const aircraftFh = aircraft?.flight_hours ?? '—';
  const aircraftFc = aircraft?.flight_cycles ?? '—';

  const isSubmitDisabled =
    !componentId ||
    installComponent.isPending ||
    !activeDraft.serial_number.trim() ||
    !activeDraft.part_number.trim() ||
    !activeDraft.installed_at ||
    (sourceMode === 'warehouse' && !warehouseDraft.article_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="space-y-0 px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                <Plug2 className="size-5 text-foreground" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold">Montar componente</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Selecciona origen, confirma identidad del componente y registra tiempos al montaje.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex items-center gap-3 border-y bg-sky-50 px-6 py-2.5 dark:bg-sky-950/20">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-sky-200 bg-sky-500/10 dark:border-sky-800/40">
              <Plane className="size-3 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400">
              Aeronave
            </span>
            <span className="text-foreground/40">·</span>
            <span className="font-mono text-sm font-medium text-foreground">
              {aircraft?.acronym ?? '—'}
            </span>

            <div className="ml-auto flex items-center gap-4">
              {slotLabel ? (
                <div className="flex items-center gap-1.5">
                  <FieldLabel>Slot</FieldLabel>
                  <span className="font-mono text-xs font-medium text-foreground">{slotLabel}</span>
                </div>
              ) : null}
              {componentLabel ? (
                <div className="flex items-center gap-1.5">
                  <FieldLabel>Posición</FieldLabel>
                  <span className="text-xs font-medium text-foreground">{componentLabel}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-1.5">
                <FieldLabel>FH</FieldLabel>
                <span className="font-mono text-xs font-medium text-foreground">{aircraftFh}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FieldLabel>FC</FieldLabel>
                <span className="font-mono text-xs font-medium text-foreground">{aircraftFc}</span>
              </div>
            </div>
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center border-b bg-muted/20 px-6">
                <SourceTab
                  active={isWarehouseMode}
                  icon={Boxes}
                  label="Desde almacén"
                  onClick={() => setSourceMode('warehouse')}
                />
                <SourceTab
                  active={!isWarehouseMode}
                  icon={PenLine}
                  label="Manual"
                  onClick={() => setSourceMode('manual')}
                />
                {defaultPartNumber ? (
                  <Badge
                    variant="outline"
                    className="ml-auto h-6 rounded-md border-border/60 bg-background px-2 font-mono text-[11px]"
                  >
                    P/N referencia {defaultPartNumber}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-5 px-6 py-5">
                {isWarehouseMode ? (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-lg border bg-background">
                      <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-2.5">
                        <FieldLabel>Inventario serializado</FieldLabel>
                        <span className="text-[11px] text-muted-foreground">
                          {isWarehouseLoading
                            ? 'Cargando…'
                            : `${filteredWarehouseRows.length} / ${warehouseRows.length}`}
                        </span>
                        <div className="relative ml-auto w-full max-w-xs">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Serial, P/N o batch"
                            className="h-7 pl-8 text-xs"
                          />
                        </div>
                      </div>

                      {isWarehouseError ? (
                        <div className="p-4">
                          <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertDescription>
                              No se pudo cargar inventario de componentes desde almacén.
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : isWarehouseLoading ? (
                        <WarehouseTableSkeleton />
                      ) : filteredWarehouseRows.length === 0 ? (
                        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
                            <Boxes className="size-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {warehouseRows.length === 0
                              ? 'No hay componentes serializados disponibles'
                              : 'Sin resultados para la búsqueda'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {warehouseRows.length === 0
                              ? 'Puedes continuar en modo manual.'
                              : 'Ajusta la búsqueda o cambia a manual.'}
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[260px]">
                          <Table>
                            <TableHeader className="sticky top-0 z-10 bg-muted/30 backdrop-blur">
                              <TableRow className="border-b">
                                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  Serial
                                </TableHead>
                                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  P/N
                                </TableHead>
                                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  Batch
                                </TableHead>
                                <TableHead className="h-9 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  FH
                                </TableHead>
                                <TableHead className="h-9 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  FC
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredWarehouseRows.map((row) => {
                                const isSelected = row.article_id === selectedWarehouseArticleId;
                                return (
                                  <TableRow
                                    key={row.article_id}
                                    className={cn(
                                      'cursor-pointer border-b transition-colors hover:bg-muted/30',
                                      isSelected &&
                                        'bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/30 dark:hover:bg-sky-950/40',
                                    )}
                                    onClick={() => void handleWarehouseDetailFetch(row)}
                                  >
                                    <TableCell className="font-mono text-sm font-medium text-foreground">
                                      <span className="flex items-center gap-2">
                                        {isSelected ? (
                                          <CheckCircle2 className="size-3.5 text-sky-600 dark:text-sky-400" />
                                        ) : (
                                          <span className="size-3.5" />
                                        )}
                                        {row.serial}
                                      </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{row.part_number}</TableCell>
                                    <TableCell className="text-sm text-foreground/80">
                                      {row.batch_name}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm tabular-nums">
                                      {row.hour_date ?? 0}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm tabular-nums">
                                      {row.cycle_date ?? 0}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </div>

                    {warehouseErrorMessage ? (
                      <Alert variant="default" className="border-amber-500/30 bg-amber-500/10">
                        <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                          {warehouseErrorMessage}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {selectedWarehouseRow ? (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-sky-200 bg-sky-50/60 px-4 py-2.5 dark:border-sky-800/40 dark:bg-sky-950/20">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-sky-600 dark:text-sky-400" />
                          <FieldLabel>Seleccionado</FieldLabel>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FieldLabel>Serial</FieldLabel>
                          <span className="font-mono text-xs font-medium text-foreground">
                            {selectedWarehouseRow.serial}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FieldLabel>P/N</FieldLabel>
                          <span className="font-mono text-xs font-medium text-foreground">
                            {selectedWarehouseRow.part_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FieldLabel>Batch</FieldLabel>
                          <span className="text-xs text-foreground/80">{selectedWarehouseRow.batch_name}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-background">
                      <PenLine className="size-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">Entrada sin referencia de almacén</p>
                      <p className="text-xs text-muted-foreground">
                        Ingresa manualmente serial, P/N y tiempos del componente. No se vinculará a un
                        artículo del inventario.
                      </p>
                    </div>
                  </div>
                )}

                <div className="overflow-hidden rounded-lg border bg-background">
                  <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2.5">
                    <FieldLabel>Confirmación de montaje</FieldLabel>
                    <span className="text-[11px] text-muted-foreground">
                      {isWarehouseMode
                        ? 'Ajusta si el valor real difiere del registrado en inventario'
                        : 'Todos los campos son obligatorios'}
                    </span>
                  </div>

                  <div className="grid gap-x-4 gap-y-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    <ConfirmationField
                      label="Serial Number"
                      value={activeDraft.serial_number}
                      onChange={(value) => updateActiveDraft('serial_number', value)}
                      placeholder="SN-00000"
                      required
                      mono
                    />
                    <ConfirmationField
                      label="Part Number"
                      value={activeDraft.part_number}
                      onChange={(value) => updateActiveDraft('part_number', value)}
                      placeholder="P/N"
                      required
                      mono
                    />
                    <ConfirmationField
                      label="Fecha de montaje"
                      type="date"
                      value={activeDraft.installed_at}
                      onChange={(value) => updateActiveDraft('installed_at', value)}
                      required
                    />
                    <ConfirmationField
                      label="FH componente al montar"
                      type="number"
                      step="0.01"
                      value={activeDraft.component_hours_at_install}
                      onChange={(value) => updateActiveDraft('component_hours_at_install', value)}
                      required
                      mono
                    />
                    <ConfirmationField
                      label="FC componente al montar"
                      type="number"
                      value={activeDraft.component_cycles_at_install}
                      onChange={(value) => updateActiveDraft('component_cycles_at_install', value)}
                      required
                      mono
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t bg-muted/15 px-6 py-3 sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Un solo montaje por operación. El backend resuelve inventario cuando el origen es almacén.
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2" disabled={isSubmitDisabled}>
                  {installComponent.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Montando…
                    </>
                  ) : (
                    <>
                      <PackageCheck className="size-4" />
                      Montar componente
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
