'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { ArticleData } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { useCreateArticle, useUpdateArticle } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { MultiInputField } from '@/components/misc/MultiInputField';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGetConditions } from '@/hooks/administracion/useGetConditions';
import { useGetManufacturers } from '@/hooks/general/fabricantes/useGetManufacturers';
import { useGetBatchesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByCategory';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';

import loadingGif from '@/public/images/loading2.gif';

import { ArticleFormProps } from '../_lib/types';
import { normalizeUpper } from '../_lib/utils';
import { CertificatesSection, ConditionSelect, DatePickerField, ManufacturerSelect } from './fields';
import { toolFormSchema, ToolFormValues } from './schemas/tool.schema';

export default function CreateToolForm({ initialData, isEditing }: ArticleFormProps) {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();

  const {
    data: batches,
    isPending: isBatchesLoading,
    isError: isBatchesError,
  } = useGetBatchesByCategory('herramienta');
  const {
    data: manufacturers,
    isLoading: isManufacturerLoading,
    isError: isManufacturerError,
  } = useGetManufacturers(selectedCompany?.slug);
  const { data: conditions, isLoading: isConditionsLoading, error: isConditionsError } = useGetConditions();

  const { createArticle } = useCreateArticle();
  const { updateArticle } = useUpdateArticle();

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      part_number: initialData?.part_number || '',
      inspector: initialData?.inspector || '',
      reception_date: initialData?.reception_date || '',
      alternative_part_number:
        typeof initialData?.alternative_part_number === 'string' ? [] : (initialData?.alternative_part_number ?? []),
      serial: initialData?.serial || '',
      description: initialData?.description || '',
      zone: initialData?.zone || '',
      manufacturer_id: initialData?.manufacturer?.id?.toString() || '',
      condition_id: initialData?.condition?.id?.toString() || '',
      batch_id: initialData?.batches?.id?.toString() || '',
      needs_calibration: !!initialData?.tool?.needs_calibration,
      calibration_date: initialData?.tool?.calibration_date ? new Date(initialData.tool.calibration_date) : undefined,
      next_calibration: initialData?.tool?.next_calibration ? Number(initialData.tool.next_calibration) : undefined,
    },
  });

  useEffect(() => {
    if (!initialData) return;

    form.reset({
      part_number: initialData.part_number || '',
      inspector: initialData.inspector || '',
      reception_date: initialData.reception_date || '',
      alternative_part_number: initialData.alternative_part_number || [],
      serial: initialData.serial || '',
      description: initialData.description || '',
      zone: initialData.zone || '',
      manufacturer_id: initialData.manufacturer?.id?.toString() || '',
      condition_id: initialData.condition?.id?.toString() || '',
      batch_id: initialData.batches?.id?.toString() || '',
      needs_calibration: !!initialData.tool?.needs_calibration,
      calibration_date: initialData.tool?.calibration_date ? new Date(initialData.tool.calibration_date) : undefined,
      next_calibration: initialData.tool?.next_calibration ? Number(initialData.tool.next_calibration) : undefined,
    });
  }, [initialData, form]);

  const busy =
    isBatchesLoading ||
    isManufacturerLoading ||
    isConditionsLoading ||
    createArticle.isPending ||
    updateArticle.isPending;

  const isCalibrated = form.watch('needs_calibration');

  const onSubmit = async (values: ToolFormValues) => {
    if (!selectedCompany?.slug) return;

    const payload: ArticleData = {
      ...values,
      article_type: 'tool',
      part_number: normalizeUpper(values.part_number),
      alternative_part_number: values.alternative_part_number?.map((v) => normalizeUpper(v)) ?? [],
      calibration_date: values.calibration_date ? format(values.calibration_date, 'yyyy-MM-dd') : undefined,
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
    }
  };

  return (
    <Form {...form}>
      <form className="flex flex-col gap-6 max-w-7xl mx-auto" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wrench className="h-5 w-5" />
              Registrar herramienta
            </CardTitle>
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
              label="Fecha de recepción"
              initialDate={initialData?.reception_date ? new Date(initialData.reception_date) : undefined}
            />
            <FormField
              control={form.control}
              name="part_number"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nro. de parte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: TW-500" {...field} />
                  </FormControl>
                  <FormDescription>Identificador principal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serial"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Serial</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: S-000123" {...field} />
                  </FormControl>
                  <FormDescription>Serial de la herramienta.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alternative_part_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nros. de parte alternos</FormLabel>
                  <FormControl>
                    <MultiInputField
                      values={field.value || []}
                      onChange={field.onChange}
                      placeholder="Ej: P/N-ALT-01, PN-ALT-02"
                      label=""
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Clasificación y estado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Clasificación y estado</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ManufacturerSelect
              form={form}
              name="manufacturer_id"
              manufacturers={manufacturers}
              isLoading={isManufacturerLoading}
              isError={isManufacturerError}
              description="Marca del fabricante."
              filterType={null}
            />
            <ConditionSelect
              form={form}
              name="condition_id"
              conditions={conditions}
              isLoading={isConditionsLoading}
              isError={!!isConditionsError}
              description="Estado físico/operativo."
            />
            <FormField
              control={form.control}
              name="batch_id"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isBatchesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isBatchesLoading ? 'Cargando...' : 'Seleccione categoría...'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {batches?.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name}
                        </SelectItem>
                      ))}
                      {(!batches || batches.length === 0) && !isBatchesLoading && !isBatchesError && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No se han encontrado categorías.
                        </div>
                      )}
                      {isBatchesError && (
                        <div className="p-2 text-sm text-muted-foreground text-center">Error al cargar categorías.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>Clasificación interna.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ubicación interna</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Taller, Estantería B" {...field} />
                  </FormControl>
                  <FormDescription>Zona física en almacén/taller.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Calibración */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Calibración</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="needs_calibration"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>¿Requiere calibración?</FormLabel>
                    <FormDescription>Activa los campos de calibración si aplica.</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            {isCalibrated && (
              <>
                <FormField
                  control={form.control}
                  name="calibration_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full mt-1.5 space-y-3">
                      <FormLabel>Última calibración</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: es })
                              ) : (
                                <span>Seleccione una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            locale={es}
                            mode="single"
                            selected={field.value}
                            onSelect={(d) =>
                              form.setValue('calibration_date', d, { shouldDirty: true, shouldValidate: true })
                            }
                            initialFocus
                            month={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Fecha de la última calibración realizada.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="next_calibration"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Días hasta la próxima calibración</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          placeholder="Ej: 180"
                          value={field.value as any}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>Número de días para programar la próxima calibración.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Ej: Torquímetro 1/2'' rango 20–200 Nm..." {...field} />
                  </FormControl>
                  <FormDescription>Breve descripción técnica.</FormDescription>
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
            disabled={busy || !selectedCompany}
            type="submit"
          >
            {busy ? (
              <Image className="text-black" src={loadingGif} width={170} height={170} alt="Cargando..." />
            ) : (
              <span>{isEditing ? 'Confirmar ingreso' : 'Crear herramienta'}</span>
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
