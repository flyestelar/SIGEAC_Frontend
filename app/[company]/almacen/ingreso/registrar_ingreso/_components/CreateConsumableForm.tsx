'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { ArticleData } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { useCreateArticle, useUpdateArticle } from '@/actions/mantenimiento/almacen/inventario/articulos/actions';
import { MultiInputField } from '@/components/misc/MultiInputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useGetConditions } from '@/hooks/administracion/useGetConditions';
import { useGetManufacturers } from '@/hooks/general/fabricantes/useGetManufacturers';
import { useGetSecondaryUnits } from '@/hooks/general/unidades/useGetSecondaryUnits';
import { useGetBatchesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByCategory';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Convertion } from '@/types';

import loadingGif from '@/public/images/loading2.gif';

import { ArticleFormProps } from '../_lib/types';
import { normalizeUpper } from '../_lib/utils';
import { BatchCombobox, CertificatesSection, ConditionSelect, DatePickerField, ManufacturerSelect } from './fields';
import { consumableFormSchema, ConsumableFormValues } from './schemas/consumable.schema';

type SecondaryUnitOption = Pick<Convertion, 'id' | 'secondary_unit' | 'convertion_rate' | 'quantity_unit'>;

export default function CreateConsumableForm({ initialData, isEditing }: ArticleFormProps) {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();

  const { data: batches, isPending: isBatchesLoading, isError: isBatchesError } = useGetBatchesByCategory('consumible');
  const {
    data: manufacturers,
    isLoading: isManufacturerLoading,
    isError: isManufacturerError,
  } = useGetManufacturers(selectedCompany?.slug);
  const { data: conditions, isLoading: isConditionsLoading, error: isConditionsError } = useGetConditions();
  const { data: secondaryUnits, isLoading: secondaryLoading } = useGetSecondaryUnits();

  const { createArticle } = useCreateArticle();
  const { updateArticle } = useUpdateArticle();

  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [secondarySelected, setSecondarySelected] = useState<SecondaryUnitOption | null>(null);
  const [secondaryQuantity, setSecondaryQuantity] = useState<number | undefined>();

  const initialConvertion = initialData?.consumable?.convertions?.[0];

  const form = useForm<ConsumableFormValues>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues: {
      part_number: initialData?.part_number || '',
      inspector: initialData?.inspector || '',
      reception_date: initialData?.reception_date || '',
      alternative_part_number:
        typeof initialData?.alternative_part_number === 'string' ? [] : (initialData?.alternative_part_number ?? []),
      batch_id: initialData?.batches?.id?.toString() || '',
      manufacturer_id: initialData?.manufacturer?.id?.toString() || '',
      condition_id: initialData?.condition?.id?.toString() || '',
      description: initialData?.description || '',
      zone: initialData?.zone || '',
      lot_number: initialData?.consumable?.lot_number || '',
      caducate_date: initialData?.consumable?.caducate_date ?? undefined,
      fabrication_date: initialData?.consumable?.fabrication_date ?? undefined,
      quantity: initialData?.consumable?.quantity ? parseFloat(initialData.consumable.quantity) : 0,
      is_managed: initialData?.consumable?.is_managed ?? true,
      convertion_id: initialConvertion?.id,
    },
  });

  useEffect(() => {
    if (!initialData) return;

    const selectedConvertion =
      secondaryUnits?.find((unit) => unit.id === initialData.consumable?.convertions?.[0]?.id) ??
      initialData.consumable?.convertions?.[0] ??
      null;
    const baseQuantity = initialData.consumable?.quantity ? parseFloat(initialData.consumable.quantity) : 0;
    const conversionFactor = selectedConvertion
      ? (selectedConvertion.convertion_rate ?? 1) * (selectedConvertion.quantity_unit ?? 1)
      : 1;

    setSecondarySelected(selectedConvertion);
    setSecondaryQuantity(conversionFactor > 0 ? baseQuantity / conversionFactor : baseQuantity);

    form.reset({
      part_number: initialData.part_number ?? '',
      inspector: initialData.inspector ?? '',
      reception_date: initialData.reception_date ?? '',
      alternative_part_number:
        typeof initialData?.alternative_part_number === 'string' ? [] : (initialData?.alternative_part_number ?? []),
      batch_id: initialData.batches?.id?.toString() ?? '',
      manufacturer_id: initialData.manufacturer?.id?.toString() ?? '',
      condition_id: initialData.condition?.id?.toString() ?? '',
      description: initialData.description ?? '',
      zone: initialData.zone ?? '',
      lot_number: initialData.consumable?.lot_number ?? '',
      caducate_date: initialData.consumable?.caducate_date ?? undefined,
      fabrication_date: initialData.consumable?.fabrication_date ?? undefined,
      quantity: initialData.consumable?.quantity ? parseFloat(initialData.consumable.quantity) : 0,
      is_managed: initialData.consumable?.is_managed ?? true,
      convertion_id: selectedConvertion?.id,
    });
  }, [initialData, secondaryUnits, form]);

  // Secondary unit → quantity conversion
  useEffect(() => {
    if (secondarySelected && typeof secondaryQuantity === 'number' && !Number.isNaN(secondaryQuantity)) {
      const qty = (secondarySelected.convertion_rate ?? 1) * (secondarySelected.quantity_unit ?? 1) * secondaryQuantity;
      form.setValue('quantity', qty, { shouldDirty: true, shouldValidate: true });
    }
  }, [secondarySelected, secondaryQuantity, form]);

  const busy =
    isBatchesLoading ||
    isManufacturerLoading ||
    isConditionsLoading ||
    createArticle.isPending ||
    updateArticle.isPending;

  const onSubmit = async (values: ConsumableFormValues) => {
    if (!selectedCompany?.slug) return;

    const payload: ArticleData = {
      ...values,
      part_number: normalizeUpper(values.part_number),
      article_type: 'consumable',
      alternative_part_number: values.alternative_part_number?.map((v) => normalizeUpper(v)) ?? [],
      convertion_id: secondarySelected?.id,
    };

    if (isEditing && initialData) {
      const updatePayload = { ...payload };
      delete updatePayload.article_type;

      await updateArticle.mutateAsync({
        data: updatePayload,
        id: initialData.id,
        company: selectedCompany.slug,
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
            <CardTitle className="text-xl">Registrar consumible</CardTitle>
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
              label="Fecha de incoming"
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
              name="lot_number"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nro. de lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: LOTE123" {...field} />
                  </FormControl>
                  <FormDescription>Lote del consumible.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alternative_part_number"
              render={({ field }) => (
                <FormItem className="w-full xl:col-span-1">
                  <FormControl>
                    <MultiInputField values={field.value || []} onChange={field.onChange} placeholder="Ej: 234ABAC" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Propiedades */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Propiedades</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ConditionSelect
              form={form}
              name="condition_id"
              conditions={conditions}
              isLoading={isConditionsLoading}
              isError={!!isConditionsError}
              description="Estado del artículo."
            />
            <DatePickerField
              form={form}
              name="fabrication_date"
              label="Fecha de Fabricación"
              description="Fecha de creación del artículo."
              yearJump="past"
              initialDate={
                initialData?.consumable?.fabrication_date
                  ? new Date(initialData.consumable.fabrication_date)
                  : undefined
              }
            />
            <DatePickerField
              form={form}
              name="caducate_date"
              label="Fecha de Caducidad"
              description="Fecha límite del artículo."
              yearJump="future"
              initialDate={
                initialData?.consumable?.caducate_date ? new Date(initialData.consumable.caducate_date) : undefined
              }
            />
            <ManufacturerSelect
              form={form}
              name="manufacturer_id"
              manufacturers={manufacturers}
              isLoading={isManufacturerLoading}
              isError={isManufacturerError}
              description="Marca específica del artículo."
            />
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ubicación interna</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pasillo 4, repisa 3..." {...field} />
                  </FormControl>
                  <FormDescription>Zona física en almacén.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <BatchCombobox
              form={form}
              name="batch_id"
              label="Descripción de Consumible"
              description="Descripción del consumible a registrar."
              batches={batches}
              isLoading={isBatchesLoading}
              isError={isBatchesError}
            />
          </CardContent>
        </Card>

        {/* Ingreso y cantidad */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Ingreso y cantidad</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-2 mt-2.5">
              <FormLabel>Método de ingreso</FormLabel>
              <Popover open={secondaryOpen} onOpenChange={setSecondaryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={secondaryLoading}
                    variant="outline"
                    role="combobox"
                    aria-expanded={secondaryOpen}
                    className="justify-between"
                  >
                    {secondarySelected
                      ? `${secondarySelected.secondary_unit}`
                      : secondaryLoading
                        ? 'Cargando...'
                        : 'Seleccione...'}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar unidad..." />
                    <CommandList>
                      <CommandEmpty>No existen unidades secundarias.</CommandEmpty>
                      <CommandGroup>
                        {secondaryUnits?.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.id.toString()}
                            onSelect={(val) => {
                              const found = secondaryUnits.find((u) => u.id.toString() === val) || null;
                              setSecondarySelected(found);
                              setSecondaryOpen(false);
                              if (found && typeof secondaryQuantity === 'number') {
                                const calc =
                                  (found.convertion_rate ?? 1) * (found.quantity_unit ?? 1) * (secondaryQuantity ?? 0);
                                form.setValue('quantity', calc, { shouldDirty: true, shouldValidate: true });
                                form.setValue('convertion_id', found.id, { shouldDirty: true });
                              }
                            }}
                          >
                            {s.secondary_unit}
                            <Check
                              className={cn(
                                'ml-auto',
                                secondarySelected?.id.toString() === s.id.toString() ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">Indique cómo será ingresado el artículo.</p>
            </div>

            <div className="space-y-2">
              <FormLabel>Cantidad</FormLabel>
              <Input
                type="number"
                inputMode="decimal"
                value={secondaryQuantity ?? ''}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  setSecondaryQuantity(Number.isNaN(n) ? undefined : n);
                }}
                placeholder="Ej: 2, 4, 6..."
              />
              <p className="text-sm text-muted-foreground">Cantidad según método de ingreso seleccionado.</p>
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Cantidad resultante</FormLabel>
                  <FormControl>
                    <Input disabled type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Unidades base que se registrarán.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_managed"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>¿Es manejable?</FormLabel>
                    <FormDescription>Marca si el artículo se maneja como consumible.</FormDescription>
                  </div>
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
                  <FormLabel>Detalles/Observaciones</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Ej: Fluido hidráulico MIL-PRF-83282..." {...field} />
                  </FormControl>
                  <FormDescription>Observaciones sobre el artículo.</FormDescription>
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
