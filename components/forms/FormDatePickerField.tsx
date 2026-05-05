'use client';

import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, LucideIcon } from 'lucide-react';
import { ComponentProps } from 'react';
import { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerValueType = 'string' | 'date';

interface FormDatePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  icon?: LucideIcon;
  label?: React.ReactNode;
  placeholder?: string;
  valueType?: DatePickerValueType;
  displayFormat?: string;
  valueFormat?: string;
  buttonProps?: Omit<ComponentProps<typeof Button>, 'type' | 'variant' | 'children'>;
  calendarProps?: Omit<ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>;
}

function getSelectedDate(value: unknown) {
  if (!value) return undefined;

  if (value instanceof Date) {
    return isValid(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function FormDatePickerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  icon: Icon,
  label,
  placeholder = 'Seleccione fecha',
  valueType = 'string',
  displayFormat = 'PPP',
  valueFormat = 'yyyy-MM-dd',
  buttonProps,
  calendarProps,
  ...controllerProps
}: FormDatePickerFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => {
        const selectedDate = getSelectedDate(field.value);

        return (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('justify-between text-left font-normal', !selectedDate && 'text-muted-foreground')}
                    {...buttonProps}
                  >
                    {selectedDate ? format(selectedDate, displayFormat, { locale: es }) : placeholder}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) {
                      field.onChange(valueType === 'date' ? null : '');
                      return;
                    }

                    field.onChange(valueType === 'date' ? date : format(date, valueFormat));
                  }}
                  autoFocus
                  {...calendarProps}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
