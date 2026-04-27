'use client';

import {
  parseMaintenanceInterval
} from '@/actions/planificacion/control_mantenimiento/excelProcessor';
import { MultiAircraftSelect } from '@/components/forms/MultiAircraftSelect';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import MaintenanceControlTasksFormSection from './MaintenanceControlTasksFormSection';
import { Separator } from '@/components/ui/separator';

const taskSchema = z.object({
  description: z.string().trim().min(1, 'La descripción es obligatoria').default(''),
  old_task: z.string().trim().default(''),
  new_task: z.string().trim().default(''),
  applicable: z.boolean().default(true),
});

const maintenanceControlSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(255, 'Máximo 255 caracteres'),
  description: z.string().trim().optional(),
  manual_reference: z.string().trim().optional(),
  interval: z
    .string()
    .trim()
    .min(1, 'El intervalo es obligatorio')
    .refine((value) => {
      const parsed = parseMaintenanceInterval(value);
      return parsed.fh !== undefined || parsed.fc !== undefined || parsed.days !== undefined;
    }, 'Ingrese un intervalo válido (ejemplo: 500 FH, 24 FC, 30 días o 1A)'),
  aircraft_ids: z.array(z.number()).min(1, 'Seleccione al menos una aeronave'),
  tasks: z.array(taskSchema).min(1, 'Debe agregar al menos una tarea'),
});

export type MaintenanceControlFormValues = z.infer<typeof maintenanceControlSchema>;

interface MaintenanceControlFormProps {
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: MaintenanceControlFormValues) => Promise<void>;
  initialValues?: Partial<MaintenanceControlFormValues>;
}

const MaintenanceControlForm = ({ submitting, onCancel, onSubmit, initialValues }: MaintenanceControlFormProps) => {
  const form = useForm<MaintenanceControlFormValues>({
    resolver: zodResolver(maintenanceControlSchema),
    defaultValues: {
      title: '',
      description: '',
      manual_reference: '',
      interval: '',
      aircraft_ids: [],
      tasks: [],
      ...initialValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título del control de mantenimiento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del control de mantenimiento" className="min-h-[80px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manual_reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia de Manual</FormLabel>
              <FormControl>
                <Input placeholder="Referencia del manual" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interval"
          render={({ field }) => {
            const preview = formatInterval(field.value);
            return (
              <FormItem>
                <FormLabel>Intervalo</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input placeholder="Ejemplo: 500 FH, 24 FC o 1A" {...field} />
                    <p className="text-xs text-muted-foreground">
                      Este intervalo se aplicará automáticamente a todas las tareas del control.
                    </p>
                    {preview && <p className="text-xs font-medium text-foreground">{preview}</p>}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="aircraft_ids"
          render={({ field }) => (
            <MultiAircraftSelect
              buttonRef={field.ref}
              value={field.value}
              onChange={field.onChange}
              label="Aeronaves Aplicables"
            />
          )}
        />

        <Separator />

        <MaintenanceControlTasksFormSection />

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? initialValues
                ? 'Actualizando...'
                : 'Creando...'
              : initialValues
                ? 'Actualizar Control'
                : 'Crear Control'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaintenanceControlForm;

function formatInterval(intervalInput: string) {
  const raw = intervalInput?.trim();
  if (!raw) return null;

  const parsed = parseMaintenanceInterval(raw);
  const parts: string[] = [];

  if (parsed.fh !== undefined) parts.push(`FH: ${parsed.fh}`);
  if (parsed.fc !== undefined) parts.push(`FC: ${parsed.fc}`);
  if (parsed.days !== undefined) parts.push(`Días: ${parsed.days}`);

  return parts.length > 0 ? parts.join(' | ') : 'No se reconoce el intervalo';
}
