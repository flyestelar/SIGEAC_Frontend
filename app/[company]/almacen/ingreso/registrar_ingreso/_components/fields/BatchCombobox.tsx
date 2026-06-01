'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Batch } from '@/types';

interface BatchComboboxProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  batches?: Batch[];
  isLoading?: boolean;
  isError?: boolean;
}

export function BatchCombobox<T extends FieldValues>({
  form,
  name,
  label = 'Descripción de Componente',
  description = 'Descripción del componente a registrar.',
  batches,
  isLoading,
  isError,
}: BatchComboboxProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col space-y-3 mt-1.5 w-full">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  disabled={isLoading || isError}
                  variant="outline"
                  role="combobox"
                  className={cn('justify-between', !field.value && 'text-muted-foreground')}
                >
                  {isLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                  {field.value ? (
                    <p>{batches?.find((b) => `${b.id}` === field.value)?.name}</p>
                  ) : (
                    'Elegir descripción...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Buscar..." />
                <CommandList>
                  <CommandEmpty className="text-xs p-2 text-center">No se han encontrado resultados.</CommandEmpty>
                  <CommandGroup>
                    {batches?.map((batch) => (
                      <CommandItem
                        value={`${batch.name}`}
                        key={batch.id}
                        onSelect={() => {
                          form.setValue(name, batch.id.toString() as any, { shouldValidate: true });
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            `${batch.id}` === field.value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <p>{batch.name}</p>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
