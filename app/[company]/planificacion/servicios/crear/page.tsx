'use client';

import MaintenanceServiceApplicabilityFormSection from '@/components/forms/mantenimiento/planificacion/MaintenanceServiceApplicabilityFormSection';
import MaintenanceServiceTasksSection from '@/components/forms/mantenimiento/planificacion/MaintenanceServiceTasksSection';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import { z } from 'zod';

const RESOURCE_PATH = 'maintenance-services';

const serviceSchema = z
  .object({
    title: z.string().min(1, 'El nombre del servicio es obligatorio'),
    description: z.string().min(1, 'La descripcion es obligatoria'),
    nro_ata: z.string().optional(),
    threshold_fh: z.coerce.number().nullable(),
    threshold_fc: z.coerce.number().nullable(),
    threshold_days: z.coerce.number().nullable(),
    repeat_fh: z.coerce.number().nullable(),
    repeat_fc: z.coerce.number().nullable(),
    repeat_days: z.coerce.number().nullable(),
    aircraftTypeIds: z.array(z.number()).optional(),
    partNumbers: z.array(z.string().min(1)).optional(),
    tasks: z
      .array(
        z.object({
          id: z.number(),
          code: z.string(),
          old_code: z.string().nullish(),
          title: z.string().nullish(),
          description: z.string().nullish(),
        }),
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    const hasAircraft = (values.aircraftTypeIds?.length ?? 0) > 0;
    const hasParts = (values.partNumbers?.length ?? 0) > 0;

    if (!hasAircraft && !hasParts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aircraftTypeIds'],
        message: 'Debes seleccionar modelos o ingresar números de parte',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['partNumbers'],
        message: 'Debes seleccionar modelos o ingresar números de parte',
      });
      return;
    }

    if (hasAircraft && hasParts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['aircraftTypeIds'],
        message: 'Selecciona o modelos o números de parte, no ambos',
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['partNumbers'],
        message: 'Selecciona o modelos o números de parte, no ambos',
      });
    }
  });

export type ServiceFormValues = z.infer<typeof serviceSchema>;

type ServicePayload = {
  title: string;
  description: string;
  nro_ata: string | null;
  threshold_fh: number | null;
  threshold_fc: number | null;
  threshold_days: number | null;
  repeat_fh: number | null;
  repeat_fc: number | null;
  repeat_days: number | null;
  aircraft_type_ids: number[];
  part_numbers: string[];
  task_ids: number[];
};

const toNullableNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const toPayload = (values: ServiceFormValues): ServicePayload => {
  const ataValue = values.nro_ata?.trim();

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    nro_ata: ataValue ? ataValue : null,
    threshold_fh: toNullableNumber(values.threshold_fh),
    threshold_fc: toNullableNumber(values.threshold_fc),
    threshold_days: toNullableNumber(values.threshold_days),
    repeat_fh: toNullableNumber(values.repeat_fh),
    repeat_fc: toNullableNumber(values.repeat_fc),
    repeat_days: toNullableNumber(values.repeat_days),
    aircraft_type_ids: values.aircraftTypeIds ?? [],
    part_numbers: (values.partNumbers ?? []).map((part) => part.trim()).filter((part) => part.length > 0),
    task_ids: values.tasks?.map((task) => task.id) ?? [],
  };
};

const defaultValues: ServiceFormValues = {
  title: '',
  description: '',
  nro_ata: '',
  threshold_fh: null,
  threshold_fc: null,
  threshold_days: null,
  repeat_fh: null,
  repeat_fc: null,
  repeat_days: null,
  aircraftTypeIds: [],
  partNumbers: [],
  tasks: [],
};

const MaintenanceServiceCreatePage = () => {
  const { selectedCompany } = useCompanyStore();
  const companySlug = selectedCompany?.slug;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues,
  });

  const { control } = form;

  const resetFormState = () => {
    form.reset(defaultValues);
  };

  const createMutation = useMutation({
    mutationFn: async ({ payload, company }: { payload: ServicePayload; company: string }) => {
      await axiosInstance.post(`/${company}/${RESOURCE_PATH}`, payload);
    },
    onSuccess: () => {
      toast.success('Servicio creado correctamente');
      resetFormState();
    },
    onError: () => {
      toast.error('No se pudo crear el servicio');
    },
  });

  const isSubmitting = createMutation.isPending;

  const onSubmit = async (values: ServiceFormValues) => {
    if (!companySlug) {
      toast.error('Debe seleccionar una compania para continuar');
      return;
    }

    const payload = toPayload(values);

    await createMutation.mutateAsync({
      payload,
      company: companySlug,
    });
  };

  return (
    <ContentLayout title="Servicios de Mantenimiento">
      <div className="flex flex-col text-center justify-center gap-2">
        <h1 className="font-bold text-5xl">Crear Servicio</h1>
        <p className="text-muted-foreground italic text-sm">
          Define las tareas, modelos de aeronaves y partes asociadas a este servicio de mantenimiento.
        </p>
      </div>

      <Card className="mt-6 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Datos del servicio</CardTitle>
          <CardDescription>Completa los campos para registrar un nuevo servicio de mantenimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          {!companySlug ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Selecciona una compania para crear servicios.
            </p>
          ) : (
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="md:grid md:grid-cols-3 gap-4">
                  <FormField
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nombre del Servicio</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Revisión final pre-vuelo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="nro_ata"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nro ATA</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. 27-30-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripcion</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ej. Servicio A - Inspeccion estructural" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <FormField
                    name="threshold_fh"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold FH</FormLabel>
                        <FormControl>
                          <NumericFormat
                            customInput={Input}
                            min={0}
                            placeholder="0"
                            value={field.value ?? ''}
                            onValueChange={(values, { source }) => {
                              if (source !== 'event') return;
                              const { floatValue } = values;
                              field.onChange(floatValue ?? null);
                            }}
                            thousandSeparator=""
                            decimalScale={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="threshold_fc"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold FC</FormLabel>
                        <FormControl>
                          <NumericFormat
                            customInput={Input}
                            min={0}
                            placeholder="0"
                            value={field.value ?? ''}
                            onValueChange={(values, { source }) => {
                              if (source !== 'event') return;
                              const { floatValue } = values;
                              field.onChange(floatValue ?? null);
                            }}
                            thousandSeparator=""
                            decimalScale={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="threshold_days"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold Dias</FormLabel>
                        <FormControl>
                          <NumericFormat
                            customInput={Input}
                            min={0}
                            placeholder="0"
                            value={field.value ?? ''}
                            onValueChange={(values, { source }) => {
                              if (source !== 'event') return;
                              const { floatValue } = values;
                              field.onChange(floatValue ?? null);
                            }}
                            thousandSeparator=""
                            decimalScale={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    name="repeat_fh"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat FH</FormLabel>
                        <FormControl>
                          <NumericFormat
                            customInput={Input}
                            min={0}
                            placeholder="0"
                            value={field.value ?? ''}
                            onValueChange={(values, { source }) => {
                              if (source !== 'event') return;
                              const { floatValue } = values;
                              field.onChange(floatValue ?? null);
                            }}
                            thousandSeparator=""
                            decimalScale={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="repeat_fc"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat FC</FormLabel>
                        <FormControl>
                          <NumericFormat
                            customInput={Input}
                            min={0}
                            placeholder="0"
                            value={field.value ?? ''}
                            onValueChange={(values, { source }) => {
                              if (source !== 'event') return;
                              const { floatValue } = values;
                              field.onChange(floatValue ?? null);
                            }}
                            thousandSeparator=""
                            decimalScale={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="repeat_days"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat Dias</FormLabel>
                        <FormControl>
                          <NumericFormat
                            customInput={Input}
                            min={0}
                            placeholder="0"
                            value={field.value ?? ''}
                            onValueChange={(values, { source }) => {
                              if (source !== 'event') return;
                              const { floatValue } = values;
                              field.onChange(floatValue ?? null);
                            }}
                            thousandSeparator=""
                            decimalScale={0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <MaintenanceServiceApplicabilityFormSection />
                <MaintenanceServiceTasksSection />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetFormState();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Crear servicio
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </ContentLayout>
  );
};

export default MaintenanceServiceCreatePage;
