'use client';

import { Button } from '@/components/ui/button';
import {
    DialogFooter
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AircraftType, Manufacturer } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const aircraftTypeSchema = z.object({
  manufacturer_id: z.string().min(1, 'Seleccione un fabricante.'),
  family: z.string().min(1, 'La familia es obligatoria.').max(255, 'Máximo 255 caracteres.'),
  series: z.string().min(1, 'La serie es obligatoria.').max(255, 'Máximo 255 caracteres.'),
  iata_code: z.string().max(64, 'Máximo 64 caracteres.').optional(),
});

export type AircraftTypeFormValues = z.infer<typeof aircraftTypeSchema>;

export type DialogMode = 'create' | 'edit';

interface AircraftTypeFormProps {
  mode: DialogMode;
  initialData?: AircraftType | null;
  manufacturers: Manufacturer[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: AircraftTypeFormValues) => Promise<void>;
}

const AircraftTypeForm = ({
  mode,
  initialData,
  manufacturers,
  submitting,
  onCancel,
  onSubmit,
}: AircraftTypeFormProps) => {
  const form = useForm<AircraftTypeFormValues>({
    resolver: zodResolver(aircraftTypeSchema),
    defaultValues: {
      manufacturer_id: initialData?.manufacturer ? String(initialData.manufacturer.id) : '',
      family: initialData?.family ?? '',
      series: initialData?.series ?? '',
      iata_code: initialData?.iata_code ?? '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="manufacturer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabricante</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={String(manufacturer.id)}>
                        {manufacturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="family"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Familia</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: A320" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="series"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serie</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="iata_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código IATA (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 320" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {mode === 'create' ? 'Crear' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default AircraftTypeForm;
