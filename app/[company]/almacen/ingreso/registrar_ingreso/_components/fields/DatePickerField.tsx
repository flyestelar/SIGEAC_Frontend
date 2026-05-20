'use client';

import { useState } from 'react';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { addYears, format, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  initialDate?: Date;
  /** 'past' = subYears, 'future' = addYears, undefined = no year jump */
  yearJump?: 'past' | 'future';
}

export function DatePickerField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  initialDate,
  yearJump,
}: DatePickerFieldProps<T>) {
  const [date, setDate] = useState<Date | undefined>(initialDate);

  const handleYearJump = (value: string) => {
    const years = parseInt(value);
    const newDate = yearJump === 'future' ? addYears(new Date(), years) : subYears(new Date(), years);
    setDate(newDate);
  };

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
              {yearJump && (
                <Select onValueChange={handleYearJump}>
                  <SelectTrigger className="p-3">
                    <SelectValue placeholder="Seleccione una opcion..." />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="0">Actual</SelectItem>
                    <SelectItem value="5">{yearJump === 'future' ? '5 años' : 'Ir 5 años atrás'}</SelectItem>
                    <SelectItem value="10">{yearJump === 'future' ? '10 años' : 'Ir 10 años atrás'}</SelectItem>
                    <SelectItem value="15">{yearJump === 'future' ? '15 años' : 'Ir 15 años atrás'}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Calendar locale={es} mode="single" selected={date} onSelect={handleSelect} initialFocus month={date} />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
