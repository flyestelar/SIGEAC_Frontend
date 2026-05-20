'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConditionSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  conditions?: { id: number; name: string }[];
  isLoading?: boolean;
  isError?: boolean;
  description?: string;
}

export function ConditionSelect<T extends FieldValues>({
  form,
  name,
  conditions,
  isLoading,
  isError,
  description = 'Estado físico/operativo del artículo.',
}: ConditionSelectProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Condición</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Cargando...' : 'Seleccione...'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {conditions?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
              {isError && <div className="p-2 text-sm text-muted-foreground">Error al cargar condiciones.</div>}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
