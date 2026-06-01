'use client';

import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { FileUpIcon } from 'lucide-react';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface FileUploadFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: React.ReactNode;
  description?: string;
  accept?: string;
}

export function FileUploadField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  accept = '.pdf,image/*',
}: FileUploadFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative h-10 w-full">
              <FileUpIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
              <Input
                type="file"
                accept={accept}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) form.setValue(name, f as any, { shouldDirty: true, shouldValidate: true });
                }}
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent cursor-pointer"
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
