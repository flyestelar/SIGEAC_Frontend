'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ManufacturerSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  manufacturers?: { id: number; name: string; type?: string }[];
  isLoading?: boolean;
  isError?: boolean;
  description?: string;
  /** Filter manufacturers by type. Defaults to 'PART'. Pass null to skip filtering. */
  filterType?: string | null;
}

export function ManufacturerSelect<T extends FieldValues>({
  form,
  name,
  manufacturers,
  isLoading,
  isError,
  description = 'Marca del artículo.',
  filterType = 'PART',
}: ManufacturerSelectProps<T>) {
  const filtered = filterType ? manufacturers?.filter((m) => m.type === filterType) : manufacturers;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Fabricante</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Cargando...' : 'Seleccione...'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {filtered?.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
              {isError && <div className="p-2 text-sm text-muted-foreground">Error al cargar fabricantes.</div>}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
