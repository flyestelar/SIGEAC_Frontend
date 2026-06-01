'use client';

import { FormDatePickerField } from '@/components/forms/FormDatePickerField';
import { FormTextField } from '@/components/forms/FormTextField';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateAirworthinessDirective } from '@/hooks/planificacion/directivas/queries';
import { AirworthinessDirectiveResource } from '@api/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const authorityOptions = ['FAA', 'EASA', 'ICAO', 'INAC'] as const;

const editSchema = z.object({
  ad_number: z.string().trim().min(1, 'La directiva es obligatoria'),
  authority: z.enum(authorityOptions, { message: 'La autoridad es obligatoria' }),
  subject_description: z.string().trim().optional(),
  issue_date: z.string().optional(),
  effective_date: z.string().optional(),
  is_recurring: z.boolean().default(false),
  pdf_document: z
    .custom<File | null>((value) => value === null || value instanceof File, {
      message: 'Seleccione un archivo PDF valido',
    })
    .refine((file) => !file || file.type === 'application/pdf', 'Solo se permite un archivo PDF')
    .nullable()
    .optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditAirworthinessDirectiveFormProps {
  directive: AirworthinessDirectiveResource;
  onSuccess: () => void;
}

export default function EditAirworthinessDirectiveForm({ directive, onSuccess }: EditAirworthinessDirectiveFormProps) {
  const update = useUpdateAirworthinessDirective(directive.id);
  const [pdfInputKey, setPdfInputKey] = useState(0);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      ad_number: directive.ad_number,
      authority: authorityOptions.includes(directive.authority as (typeof authorityOptions)[number])
        ? (directive.authority as (typeof authorityOptions)[number])
        : undefined,
      subject_description: directive.subject_description ?? '',
      issue_date: directive.issue_date ?? '',
      effective_date: directive.effective_date ?? '',
      is_recurring: directive.is_recurring,
      pdf_document: null,
    },
  });

  const onSubmit = async (values: EditFormValues) => {
    await update.mutateAsync({
      path: { id: String(directive.id) },
      body: {
        ad_number: values.ad_number,
        authority: values.authority,
        subject_description: values.subject_description || null,
        issue_date: values.issue_date || null,
        effective_date: values.effective_date || null,
        is_recurring: +values.is_recurring as any,
        pdf_document: values.pdf_document ?? null,
      },
    });
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextField
            control={form.control}
            name="ad_number"
            label="Número de directiva"
            inputProps={{ placeholder: 'AD 2026-01' }}
          />

          <FormField
            control={form.control}
            name="authority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Autoridad</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione la autoridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {authorityOptions.map((authority) => (
                      <SelectItem key={authority} value={authority}>
                        {authority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asunto</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el alcance operativo o técnico de la directiva"
                  className="min-h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormDatePickerField control={form.control} name="issue_date" label="Fecha de emisión" />
          <FormDatePickerField control={form.control} name="effective_date" label="Fecha de vigencia" />
        </div>

        <FormField
          control={form.control}
          name="pdf_document"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Documento PDF</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <Input
                    key={pdfInputKey}
                    {...field}
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                  />

                  {directive.pdf_document_url && !value ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                      <p className="font-medium text-emerald-700">Archivo cargado</p>
                      <p className="mt-1 text-xs text-emerald-700/90">
                        Si cargas un nuevo PDF, se reemplazara el archivo actual.
                      </p>
                      <a
                        href={directive.pdf_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-emerald-700 underline"
                      >
                        Ver documento actual
                      </a>
                    </div>
                  ) : null}

                  {value ? (
                    <div className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{value.name}</p>
                        <p className="text-xs text-muted-foreground">PDF listo para reemplazar el archivo actual.</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onChange(null);
                          setPdfInputKey((current) => current + 1);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_recurring"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <div className="space-y-1">
                <FormLabel className="text-sm">Recurrente</FormLabel>
                <p className="text-xs text-muted-foreground">Activa el comportamiento recurrente de la directiva.</p>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}
