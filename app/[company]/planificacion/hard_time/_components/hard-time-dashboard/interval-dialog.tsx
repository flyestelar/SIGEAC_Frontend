import { useEffect, useState } from 'react';
import { Loader2, CalendarClock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateHardTimeInterval, useUpdateHardTimeInterval } from '@/actions/planificacion/hard_time/actions';
import { FormSection } from './form-section';
import { MetricFieldCard } from './metric-field-card';
import { IntervalFormState } from './types';
import { todayDate, parseOptionalInteger, parseOptionalNumber } from './utils';
import { StoreIntervalRequest, UpdateIntervalRequest } from '@api/types';
import { HardTimeInterval } from '@/types';

type IntervalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentId: number | null;
  aircraftId: number | null;
  interval: HardTimeInterval | null;
};

export function IntervalDialog({ open, onOpenChange, componentId, aircraftId, interval }: IntervalDialogProps) {
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

    if (interval) {
      const payload: UpdateIntervalRequest = {
        task_description: form.task_description.trim(),
        interval_hours: parseOptionalNumber(form.interval_hours),
        interval_cycles: parseOptionalInteger(form.interval_cycles),
        interval_days: parseOptionalInteger(form.interval_days),
      };
      await updateInterval.mutateAsync(payload);
    } else {
      const payload: StoreIntervalRequest = {
        task_description: form.task_description.trim(),
        interval_hours: parseOptionalNumber(form.interval_hours),
        interval_cycles: parseOptionalInteger(form.interval_cycles),
        interval_days: parseOptionalInteger(form.interval_days),
      };
      await createInterval.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const isPending = createInterval.isPending || updateInterval.isPending;
  const hasAnyThreshold =
    Boolean(form.interval_hours.trim()) || Boolean(form.interval_cycles.trim()) || Boolean(form.interval_days.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{interval ? 'Editar intervalo' : 'Nuevo intervalo'}</DialogTitle>
          <DialogDescription>
            Define tarea y umbrales. Usa uno o varios disparadores: horas, ciclos o calendario.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormSection
            icon={CalendarClock}
            title="Tarea controlada"
            description="Nombre operativo que verá planificación al revisar este componente."
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción de tarea</label>
              <Input
                value={form.task_description}
                onChange={(event) => setForm((current) => ({ ...current, task_description: event.target.value }))}
                placeholder="Inspección 500 FH / overhaul / replacement"
                required
              />
            </div>
          </FormSection>

          <FormSection
            icon={CalendarClock}
            title="Umbrales de vencimiento"
            description="Completa sólo métricas aplicables. Debe existir al menos una."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricFieldCard
                icon={CalendarClock}
                title="Horas de vuelo"
                unit="FH"
                hint="Límite por consumo operativo."
                value={form.interval_hours}
                step="0.01"
                onChange={(value) => setForm((current) => ({ ...current, interval_hours: value }))}
              />
              <MetricFieldCard
                icon={CalendarClock}
                title="Ciclos"
                unit="FC"
                hint="Para aterrizajes, arranques o eventos repetitivos."
                value={form.interval_cycles}
                onChange={(value) => setForm((current) => ({ ...current, interval_cycles: value }))}
              />
              <MetricFieldCard
                icon={CalendarClock}
                title="Calendario"
                unit="DÍAS"
                hint="Límite por tiempo calendario."
                value={form.interval_days}
                onChange={(value) => setForm((current) => ({ ...current, interval_days: value }))}
              />
            </div>
            <div className="mt-3 rounded-lg border border-border/60 bg-background px-3 py-2 text-[11px] text-muted-foreground">
              {hasAnyThreshold
                ? 'Intervalo listo para guardarse con métricas seleccionadas.'
                : 'Falta definir al menos un umbral para poder guardar este intervalo.'}
            </div>
          </FormSection>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!componentId || !hasAnyThreshold || isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {interval ? 'Actualizar intervalo' : 'Crear intervalo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
