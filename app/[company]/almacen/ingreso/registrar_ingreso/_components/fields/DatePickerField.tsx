'use client';

import { useEffect, useState } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  initialDate?: Date;
}

export function DatePickerField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  initialDate,
}: DatePickerFieldProps<T>) {
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const initialDateTime = initialDate?.getTime();

  useEffect(() => {
    setDate(initialDateTime ? new Date(initialDateTime) : undefined);
  }, [initialDateTime]);

  const handleSelect = (d: Date | undefined) => {
    setDate(d);
    form.setValue(name, (d ? format(d, 'yyyy-MM-dd') : '') as any, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className="flex flex-col p-0 mt-2.5 w-full">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn('w-full pl-3 text-left font-normal', !date && 'text-muted-foreground')}
                >
                  {date ? format(date, 'PPP', { locale: es }) : <span>Seleccione una fecha...</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                locale={es}
                mode="single"
                captionLayout="dropdown-buttons"
                selected={date}
                onSelect={handleSelect}
                month={date}
                fromYear={2000}
                toYear={2040}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
