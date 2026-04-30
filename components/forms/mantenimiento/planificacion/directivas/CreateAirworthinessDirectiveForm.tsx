'use client';

import { FormDatePickerField } from '@/components/forms/FormDatePickerField';
import { FormTextField } from '@/components/forms/FormTextField';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAirworthinessDirective } from '@/hooks/planificacion/directivas/queries';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const authorityOptions = ['FAA', 'EASA', 'ICAO', 'INAC'] as const;

const createAirworthinessDirectiveSchema = z.object({
  ad_number: z.string().trim().min(1, 'La directiva es obligatoria'),
  authority: z.enum(authorityOptions, {
    message: 'La autoridad es obligatoria',
  }),
  subject_description: z.string().trim().optional(),
  issue_date: z.string().optional(),
  effective_date: z.string().optional(),
  is_recurring: z.boolean().default(false),
  pdf_document: z.string().trim().optional(),
});

type CreateAirworthinessDirectiveFormValues = z.infer<typeof createAirworthinessDirectiveSchema>;

export default function CreateAirworthinessDirectiveForm({ onSuccess }: { onSuccess: () => void }) {
  const createAirworthinessDirective = useCreateAirworthinessDirective();

  const form = useForm<CreateAirworthinessDirectiveFormValues>({
    resolver: zodResolver(createAirworthinessDirectiveSchema),
    defaultValues: {
      ad_number: '',
      authority: undefined,
      subject_description: '',
      issue_date: '',
      effective_date: '',
      is_recurring: false,
      pdf_document: '',
    },
  });

  const onSubmit = async (values: CreateAirworthinessDirectiveFormValues) => {
    await createAirworthinessDirective.mutateAsync({
      body: {
        ad_number: values.ad_number,
        authority: values.authority,
        subject_description: values.subject_description || null,
        issue_date: values.issue_date || null,
        effective_date: values.effective_date || null,
        is_recurring: values.is_recurring,
        pdf_document: values.pdf_document || null,
      },
    });

    form.reset();
    onSuccess();
  };

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

        <FormTextField
          control={form.control}
          name="pdf_document"
          label="Documento PDF"
          inputProps={{ placeholder: 'URL o ruta del PDF si ya existe' }}
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
          <Button type="submit" className="gap-2" disabled={createAirworthinessDirective.isPending}>
            {createAirworthinessDirective.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar directiva
          </Button>
        </div>
      </form>
    </Form>
  );
}
