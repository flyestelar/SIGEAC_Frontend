'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultiAircraftSelect } from '@/components/forms/MultiAircraftSelect';
import { useCompanyStore } from '@/stores/CompanyStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const maintenanceControlSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  manual_reference: z.string().optional(),
  aircraft_ids: z.array(z.number()).min(1, 'Seleccione al menos una aeronave'),
  excel_file: z
    .custom<FileList>()
    .refine((files) => files && files.length === 1, 'Seleccione un archivo Excel')
    .refine(
      (files) => {
        if (!files || files.length === 0) return false;
        const file = files[0];
        return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               file.type === 'application/vnd.ms-excel' ||
               file.name.endsWith('.xlsx') ||
               file.name.endsWith('.xls');
      },
      'El archivo debe ser un Excel (.xlsx o .xls)'
    ),
});

export type MaintenanceControlFormValues = z.infer<typeof maintenanceControlSchema>;

export type DialogMode = 'create';

interface MaintenanceControlFormProps {
  mode: DialogMode;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: MaintenanceControlFormValues) => Promise<void>;
}

const MaintenanceControlForm = ({
  mode,
  submitting,
  onCancel,
  onSubmit,
}: MaintenanceControlFormProps) => {
  const { selectedCompany } = useCompanyStore();

  const form = useForm<MaintenanceControlFormValues>({
    resolver: zodResolver(maintenanceControlSchema),
    defaultValues: {
      title: '',
      description: '',
      manual_reference: '',
      aircraft_ids: [],
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
                <Textarea
                  placeholder="Descripción del control de mantenimiento"
                  className="min-h-[80px]"
                  {...field}
                />
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
          name="aircraft_ids"
          render={({ field }) => (
            <MultiAircraftSelect
              value={field.value}
              onChange={field.onChange}
              companySlug={selectedCompany?.slug}
            />
          )}
        />

        <FormField
          control={form.control}
          name="excel_file"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Archivo Excel con Tareas</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(e) => onChange(e.target.files)}
                    {...field}
                  />
                  <p className="text-xs text-muted-foreground">
                    Seleccione un archivo Excel que contenga las tareas del control de mantenimiento
                  </p>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Control'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaintenanceControlForm;