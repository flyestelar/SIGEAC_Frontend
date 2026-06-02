'use client';

import { AircraftResource } from '@api/types';
import { useInstallHardTimeComponent } from '@/actions/planificacion/hard_time/actions';
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
import { cn } from '@/lib/utils';
import { CalendarClock, Loader2, PackageCheck, PenLine, Plane, Plug2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Draft = {
  serial_number: string;
  part_number: string;
  installed_at: string;
  component_hours_at_install: string;
  component_cycles_at_install: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseRequiredNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

function ConfirmationField({
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  required = false,
  step,
  mono = false,
}: {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
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
        step={step}
        className={cn('h-9', mono && 'font-mono')}
      />
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
  const installComponent = useInstallHardTimeComponent(componentId ?? 0, aircraft?.id ?? null);
  const wasOpenRef = useRef(false);

  const [draft, setDraft] = useState<Draft>({
    serial_number: '',
    part_number: defaultPartNumber ?? '',
    installed_at: todayDate(),
    component_hours_at_install: '0',
    component_cycles_at_install: '0',
  });

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    setDraft({
      serial_number: '',
      part_number: defaultPartNumber ?? '',
      installed_at: todayDate(),
      component_hours_at_install: '0',
      component_cycles_at_install: '0',
    });
  }, [defaultPartNumber, open]);

  const updateDraft = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!componentId) return;

    await installComponent.mutateAsync({
      path: { id: componentId },
      body: {
        serial_number: draft.serial_number.trim(),
        part_number: draft.part_number.trim(),
        installed_at: draft.installed_at,
        component_hours_at_install: parseRequiredNumber(draft.component_hours_at_install),
        component_cycles_at_install: parseRequiredNumber(draft.component_cycles_at_install),
      },
    });
    onOpenChange(false);
  };

  const aircraftFh = aircraft?.flight_hours ?? '—';
  const aircraftFc = aircraft?.flight_cycles ?? '—';

  const isSubmitDisabled =
    !componentId ||
    installComponent.isPending ||
    !draft.serial_number.trim() ||
    !draft.part_number.trim() ||
    !draft.installed_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-hidden p-0">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="space-y-0 px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                <Plug2 className="size-5 text-foreground" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold">Montar componente (manual)</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ingresa manualmente serial, P/N y tiempos del componente instalado.
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
              <div className="space-y-5 px-6 py-5">
                <div className="flex items-start gap-3 rounded-lg border bg-muted/20 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-background">
                    <PenLine className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Entrada manual</p>
                    <p className="text-xs text-muted-foreground">
                      El componente ya está físicamente instalado. Registra sus datos para activar el control
                      hard time.
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-background">
                  <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2.5">
                    <FieldLabel>Confirmación de montaje</FieldLabel>
                    <span className="text-[11px] text-muted-foreground">Todos los campos son obligatorios</span>
                  </div>

                  <div className="grid gap-x-4 gap-y-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    <ConfirmationField
                      label="Serial Number"
                      value={draft.serial_number}
                      onChange={(value) => updateDraft('serial_number', value)}
                      placeholder="SN-00000"
                      required
                      mono
                    />
                    <ConfirmationField
                      label="Part Number"
                      value={draft.part_number}
                      onChange={(value) => updateDraft('part_number', value)}
                      placeholder="P/N"
                      required
                      mono
                    />
                    <ConfirmationField
                      label="Fecha de montaje"
                      type="date"
                      value={draft.installed_at}
                      onChange={(value) => updateDraft('installed_at', value)}
                      required
                    />
                    <ConfirmationField
                      label="FH componente al montar"
                      type="number"
                      step="0.01"
                      value={draft.component_hours_at_install}
                      onChange={(value) => updateDraft('component_hours_at_install', value)}
                      required
                      mono
                    />
                    <ConfirmationField
                      label="FC componente al montar"
                      type="number"
                      value={draft.component_cycles_at_install}
                      onChange={(value) => updateDraft('component_cycles_at_install', value)}
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
                Instalación manual. Para instalar desde almacén usa la opción de solicitud.
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
