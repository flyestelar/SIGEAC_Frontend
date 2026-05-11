'use client';

import { FormDatePickerField } from '@/components/forms/FormDatePickerField';
import { FormNumericField } from '@/components/forms/FormNumericField';
import { FormTextField } from '@/components/forms/FormTextField';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  airworthinessDirectiveComplianceControlsStore,
} from '@api/sdk';
import {
  useCreateAirworthinessDirective,
} from '@/hooks/planificacion/directivas/queries';
import {
  airworthinessDirectivesIndexQueryKey,
  airworthinessDirectivesComplianceControlsQueryKey,
} from '@api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const authorityOptions = ['FAA', 'EASA', 'ICAO', 'INAC'] as const;

const complianceControlItemSchema = z
  .object({
    description: z.string().trim().optional(),
    calendar_due_date: z.string().optional(),
    flight_hours_due: z.number().min(0, 'Debe ser ≥ 0').nullable().optional(),
    cycles_due: z.number().min(0, 'Debe ser ≥ 0').nullable().optional(),
    recurrence_interval_days: z.number().min(0, 'Debe ser ≥ 0').nullable().optional(),
    recurrence_interval_hours: z.number().min(0, 'Debe ser ≥ 0').nullable().optional(),
    recurrence_interval_cycles: z.number().min(0, 'Debe ser ≥ 0').nullable().optional(),
  })
  .superRefine((values, ctx) => {
    const hasLimit = [values.calendar_due_date, values.flight_hours_due, values.cycles_due].some(
      (v) => v !== undefined && v !== null && v !== '',
    );
    if (!hasLimit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Configura al menos un vencimiento (fecha, FH o FC).',
        path: ['calendar_due_date'],
      });
    }
  });

const createAirworthinessDirectiveSchema = z.object({
  ad_number: z.string().trim().min(1, 'La directiva es obligatoria'),
  authority: z.enum(authorityOptions, {
    message: 'La autoridad es obligatoria',
  }),
  subject_description: z.string().trim().optional(),
  issue_date: z.string().optional(),
  effective_date: z.string().optional(),
  is_recurring: z.boolean().default(false),
  pdf_document: z
    .custom<File | null>((value) => value === null || value instanceof File, {
      message: 'Seleccione un archivo PDF válido',
    })
    .refine((file) => !file || file.type === 'application/pdf', 'Sólo se permite un archivo PDF')
    .nullable()
    .optional(),
  controls: z.array(complianceControlItemSchema).default([]),
});

type CreateAirworthinessDirectiveFormValues = z.infer<typeof createAirworthinessDirectiveSchema>;

export default function CreateAirworthinessDirectiveForm({ onSuccess }: { onSuccess: (directiveId: number) => void }) {
  const queryClient = useQueryClient();
  const createAirworthinessDirective = useCreateAirworthinessDirective();
  const [pdfInputKey, setPdfInputKey] = useState(0);

  const form = useForm<CreateAirworthinessDirectiveFormValues>({
    resolver: zodResolver(createAirworthinessDirectiveSchema),
    defaultValues: {
      ad_number: '',
      authority: undefined,
      subject_description: '',
      issue_date: '',
      effective_date: '',
      is_recurring: false,
      pdf_document: null,
      controls: [],
    },
  });

  const { fields: controlFields, append: appendControl, remove: removeControl } = useFieldArray({
    control: form.control,
    name: 'controls',
  });

  const onSubmit = async (values: CreateAirworthinessDirectiveFormValues) => {
    const response = await createAirworthinessDirective.mutateAsync({
      body: {
        ad_number: values.ad_number,
        authority: values.authority,
        subject_description: values.subject_description || null,
        issue_date: values.issue_date || null,
        effective_date: values.effective_date || null,
        is_recurring: (values.is_recurring ? 1 : 0) as any,
        pdf_document: values.pdf_document ?? null,
      },
    });

    const directiveId = response.data.id;

    if (values.controls.length > 0) {
      await Promise.all(
        values.controls.map((control) =>
          airworthinessDirectiveComplianceControlsStore({
            path: { directiveId },
            body: {
              description: control.description || null,
              calendar_due_date: control.calendar_due_date || null,
              flight_hours_due: control.flight_hours_due ?? null,
              cycles_due: control.cycles_due ?? null,
              recurrence_interval_days: control.recurrence_interval_days ?? null,
              recurrence_interval_hours: control.recurrence_interval_hours ?? null,
              recurrence_interval_cycles: control.recurrence_interval_cycles ?? null,
            },
            throwOnError: true,
          }),
        ),
      );

      queryClient.invalidateQueries({
        queryKey: airworthinessDirectivesComplianceControlsQueryKey({
          path: { id: directiveId },
        }),
      });
    }

    queryClient.invalidateQueries({ queryKey: airworthinessDirectivesIndexQueryKey() });

    form.reset();
    setPdfInputKey((current) => current + 1);
    onSuccess(directiveId);
  };

  const isSubmitting = createAirworthinessDirective.isPending || form.formState.isSubmitting;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextField
            control={form.control}
            name="ad_number"
            label="Directiva de Aeronavegabilidad"
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
                  {value ? (
                    <div className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{value.name}</p>
                        <p className="text-xs text-muted-foreground">PDF listo para adjuntar en la directiva.</p>
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Controles de cumplimiento
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                appendControl({
                  description: '',
                  calendar_due_date: '',
                  flight_hours_due: null,
                  cycles_due: null,
                  recurrence_interval_days: null,
                  recurrence_interval_hours: null,
                  recurrence_interval_cycles: null,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Agregar control
            </Button>
          </div>

          {controlFields.length === 0 && (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              Sin controles. Puedes agregarlos aquí o desde el detalle de la directiva.
            </p>
          )}

          {controlFields.map((field, index) => (
            <div key={field.id} className="relative space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Control #{index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeControl(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FormTextField
                control={form.control}
                name={`controls.${index}.description`}
                label="Descripción"
                inputProps={{ placeholder: 'Ej. Inspección de fisuras en longerón' }}
              />

              <div className="grid gap-3 md:grid-cols-3">
                <FormDatePickerField
                  control={form.control}
                  name={`controls.${index}.calendar_due_date`}
                  label="Vence por fecha"
                  placeholder="Seleccione fecha"
                  valueType="string"
                />
                <FormNumericField
                  control={form.control}
                  name={`controls.${index}.flight_hours_due`}
                  label="Vence por FH"
                  inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 2, placeholder: '0.00' }}
                />
                <FormNumericField
                  control={form.control}
                  name={`controls.${index}.cycles_due`}
                  label="Vence por FC"
                  inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 0, placeholder: '0' }}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <FormNumericField
                  control={form.control}
                  name={`controls.${index}.recurrence_interval_days`}
                  label="Rec. días"
                  inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 0, placeholder: '0' }}
                />
                <FormNumericField
                  control={form.control}
                  name={`controls.${index}.recurrence_interval_hours`}
                  label="Rec. horas"
                  inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 2, placeholder: '0.00' }}
                />
                <FormNumericField
                  control={form.control}
                  name={`controls.${index}.recurrence_interval_cycles`}
                  label="Rec. ciclos"
                  inputProps={{ thousandSeparator: '', decimalSeparator: '.', decimalScale: 0, placeholder: '0' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {controlFields.length > 0 ? 'Guardar directiva y controles' : 'Guardar directiva'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
