'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';
import { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';
import { InputAttributes, NumericFormat, NumericFormatProps } from 'react-number-format';

interface FormNumericFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  icon?: LucideIcon;
  label?: React.ReactNode;
  inputProps?: Omit<NumericFormatProps<InputAttributes>, 'defaultValue' | 'value' | 'name'>;
}

export function FormNumericField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ inputProps, label, icon: Icon, ...controllerProps }: FormNumericFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </FormLabel>
          <FormControl>
            <NumericFormat
              {...inputProps}
              customInput={Input}
              value={field.value ?? ''}
              onValueChange={(values, { source }) => {
                if (source !== 'event') return;
                const { floatValue } = values;
                field.onChange(floatValue ?? null);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
