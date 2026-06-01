'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { ArticleData } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { useCreateArticle, useUpdateArticle } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { MultiInputField } from '@/components/misc/MultiInputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGetConditions } from '@/hooks/administracion/useGetConditions';
import { useGetManufacturers } from '@/hooks/general/fabricantes/useGetManufacturers';
import { useGetBatchesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByCategory';
import { useCompanyStore } from '@/stores/CompanyStore';

import loadingGif from '@/public/images/loading2.gif';

import { ArticleFormProps } from '../_lib/types';
import { normalizeUpper } from '../_lib/utils';
import { BatchCombobox, CertificatesSection, ConditionSelect, DatePickerField, ManufacturerSelect } from './fields';
import { componentFormSchema, ComponentFormValues } from './schemas/component.schema';

export default function CreateComponentForm({ initialData, isEditing }: ArticleFormProps) {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();

  const { data: batches, isPending: isBatchesLoading, isError: isBatchesError } = useGetBatchesByCategory('componente');
  const {
    data: manufacturers,
    isLoading: isManufacturerLoading,
    isError: isManufacturerError,
  } = useGetManufacturers(selectedCompany?.slug);
  const { data: conditions, isLoading: isConditionsLoading, error: isConditionsError } = useGetConditions();

  const { createArticle } = useCreateArticle();
  const { updateArticle } = useUpdateArticle();

  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: {
      part_number: initialData?.part_number || '',
      inspector: initialData?.inspector ?? '',
      reception_date: initialData?.reception_date ?? '',
      serial: initialData?.serial || '',
      alternative_part_number:
        typeof initialData?.alternative_part_number === 'string' ? [] : (initialData?.alternative_part_number ?? []),
      batch_id: initialData?.batches?.id?.toString() || '',
      manufacturer_id: initialData?.manufacturer?.id?.toString() || '',
      condition_id: initialData?.condition?.id?.toString() || '',
      description: initialData?.description || '',
      zone: initialData?.zone || '',
      hour_date: initialData?.component?.hour_date ? parseInt(initialData.component.hour_date) : undefined,
      cycle_date: initialData?.component?.cycle_date ? parseInt(initialData.component.cycle_date) : undefined,
      caducate_date: initialData?.component?.caducate_date ?? undefined,
      fabrication_date: initialData?.component?.fabrication_date ?? undefined,
      calendary_date: initialData?.component?.calendary_date ?? undefined,
    },
  });

  useEffect(() => {
    if (!initialData) return;

    form.reset({
      part_number: initialData.part_number ?? '',
      serial: initialData.serial ?? '',
      inspector: initialData.inspector ?? '',
      reception_date: initialData.reception_date ?? '',
      alternative_part_number: initialData.alternative_part_number ?? [],
      batch_id: initialData.batches?.id?.toString() ?? '',
      manufacturer_id: initialData.manufacturer?.id?.toString() ?? '',
      condition_id: initialData.condition?.id?.toString() ?? '',
      description: initialData.description ?? '',
      zone: initialData.zone ?? '',
      hour_date: initialData.component?.hour_date ? parseInt(initialData.component.hour_date) : undefined,
      cycle_date: initialData.component?.cycle_date ? parseInt(initialData.component.cycle_date) : undefined,
      caducate_date: initialData.component?.caducate_date ?? undefined,
      fabrication_date: initialData.component?.fabrication_date ?? undefined,
      calendary_date: initialData.component?.calendary_date ?? undefined,
    });
  }, [initialData, form]);

  const busy =
    isBatchesLoading ||
    isManufacturerLoading ||
    isConditionsLoading ||
    createArticle.isPending ||
    updateArticle.isPending;

  const onSubmit = async (values: ComponentFormValues) => {
    if (!selectedCompany?.slug) return;

    const payload: ArticleData = {
      ...values,
      article_type: 'component',
      part_number: normalizeUpper(values.part_number),
      alternative_part_number: values.alternative_part_number?.map((v) => normalizeUpper(v)) ?? [],
      inspector: values.inspector?.trim(),
    };

    if (isEditing && initialData) {
      const updatePayload = { ...payload };
      delete updatePayload.article_type;

      await updateArticle.mutateAsync({
        data: updatePayload,
        company: selectedCompany.slug,
        id: initialData.id,
      });
      router.push(`/${selectedCompany.slug}/almacen/inventario`);
    } else {
      await createArticle.mutateAsync({
        company: selectedCompany.slug,
        data: payload,
      });
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6 max-w-7xl mx-auto" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Encabezado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Registrar componente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="inspector"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Inspector (incoming)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DatePickerField
              form={form}
              name="reception_date"
              label="Fecha de Ingreso"
              initialDate={initialData?.reception_date ? new Date(initialData.reception_date) : undefined}
            />
            <FormField
              control={form.control}
              name="part_number"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nro. de parte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 234ABAC" {...field} />
                  </FormControl>
                  <FormDescription>Identificador principal del artículo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alternative_part_number"
              render={({ field }) => (
                <FormItem className="w-full xl:col-span-2">
                  <FormControl>
                    <MultiInputField values={field.value || []} onChange={field.onChange} placeholder="Ej: 234ABAC" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Identificación y estado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Identificación y estado</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="serial"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Serial</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 05458E1" {...field} />
                  </FormControl>
                  <FormDescription>Serial del componente si aplica.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ConditionSelect
              form={form}
              name="condition_id"
              conditions={conditions}
              isLoading={isConditionsLoading}
              isError={!!isConditionsError}
            />
            <ManufacturerSelect
              form={form}
              name="manufacturer_id"
              manufacturers={manufacturers}
              isLoading={isManufacturerLoading}
              isError={isManufacturerError}
            />
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ubicación interna</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pasillo 4, Estante B" {...field} />
                  </FormControl>
                  <FormDescription>Zona física en almacén.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <BatchCombobox
              form={form}
              name="batch_id"
              batches={batches}
              isLoading={isBatchesLoading}
              isError={isBatchesError}
            />
          </CardContent>
        </Card>

        {/* Ciclo de vida */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Ciclo de vida</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <DatePickerField
              form={form}
              name="fabrication_date"
              label="Fecha de Fabricación"
              description="Fecha de creación del artículo."
              initialDate={
                initialData?.component?.fabrication_date ? new Date(initialData.component.fabrication_date) : undefined
              }
            />
            <DatePickerField
              form={form}
              name="caducate_date"
              label="Fecha de caducidad"
              description="Fecha límite del artículo."
              initialDate={
                initialData?.component?.caducate_date ? new Date(initialData.component.caducate_date) : undefined
              }
            />
            <DatePickerField
              form={form}
              name="calendary_date"
              label="Fecha de Calendario"
              description="Fecha límite del componente."
              initialDate={
                initialData?.component?.calendary_date ? new Date(initialData.component.calendary_date) : undefined
              }
            />
            <FormField
              control={form.control}
              name="hour_date"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Límite de horas</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 25000" {...field} />
                  </FormControl>
                  <FormDescription>Horas máximas permitidas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cycle_date"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Límite de ciclos</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 65000" {...field} />
                  </FormControl>
                  <FormDescription>Ciclos máximos permitidos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Detalles y documentos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Detalles y documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Ej: Motor V8 de..." {...field} />
                  </FormControl>
                  <FormDescription>Breve descripción del artículo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <CertificatesSection
          form={form}
          imageName="image"
          cert8130Name="certificate_8130"
          certFabricantName="certificate_fabricant"
          certVendorName="certificate_vendor"
        />

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <Button
            className="bg-primary text-white hover:bg-blue-900 disabled:bg-slate-100 disabled:text-slate-400"
            disabled={busy || !selectedCompany || createArticle.isPending || updateArticle.isPending}
            type="submit"
          >
            {busy ? (
              <Image className="text-black" src={loadingGif} width={170} height={170} alt="Cargando..." />
            ) : (
              <span>{isEditing ? 'Confirmar ingreso' : 'Crear artículo'}</span>
            )}
          </Button>
          {busy && (
            <div className="inline-flex items-center text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando…
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
