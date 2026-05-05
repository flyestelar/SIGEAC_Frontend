'use client';

import { LucideIcon } from 'lucide-react';
import { ComponentProps } from 'react';
import { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface FormTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  icon?: LucideIcon;
  label?: React.ReactNode;
  inputProps?: Omit<ComponentProps<typeof Input>, 'name' | 'value' | 'defaultValue' | 'onChange'>;
}

export function FormTextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ inputProps, label, icon: Icon, ...controllerProps }: FormTextFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {Icon && <Icon className="h-4 w-4 inline-block mb-px mr-2" />}
            {label}
          </FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} value={field.value ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
