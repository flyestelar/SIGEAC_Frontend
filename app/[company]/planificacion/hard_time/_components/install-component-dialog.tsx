'use client';

import { AircraftResource, InstallComponentRequest } from '@api/types';
import { useInstallHardTimeComponent } from '@/actions/planificacion/hard_time/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) return null;
  return Number.parseInt(value, 10);
}

export function InstallComponentDialog({
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

    const payload: InstallComponentRequest = {
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

  const isManualEntry = form.is_manual_entry === 'true';

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
                  setForm((current) => ({
                    ...current,
                    is_manual_entry: value,
                    article_id: value === 'true' ? '' : current.article_id,
                  }))
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

          {!isManualEntry && (
            <div className="space-y-2">
              <label className="text-sm font-medium">ID artículo almacén</label>
              <Input
                type="number"
                value={form.article_id}
                onChange={(event) => setForm((current) => ({ ...current, article_id: event.target.value }))}
                placeholder="Opcional"
              />
            </div>
          )}

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
