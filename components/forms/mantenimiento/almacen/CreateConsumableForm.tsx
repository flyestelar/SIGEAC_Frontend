'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { addYears, format, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

import { CalendarIcon, Check, ChevronsUpDown, FileUpIcon, Loader2 } from 'lucide-react';

import {
  useConfirmIncomingArticle,
  useCreateArticle,
  useUpdateArticle,
} from '@/actions/mantenimiento/almacen/inventario/articulos/actions';

import { MultiInputField } from '@/components/misc/MultiInputField';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useGetConditions } from '@/hooks/administracion/useGetConditions';
import { useGetManufacturers } from '@/hooks/general/fabricantes/useGetManufacturers';
import { useGetSecondaryUnits } from '@/hooks/general/unidades/useGetSecondaryUnits';
import { useGetBatchesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByCategory';

import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Convertion } from '@/types';

import loadingGif from '@/public/loading2.gif';
import { EditingArticle } from './RegisterArticleForm';

/* ------------------------------- Schema ------------------------------- */

const fileMaxBytes = 10_000_000; // 10 MB

const formSchema = z.object({
  part_number: z
    .string({ message: 'Debe ingresar un número de parte.' })
    .min(2, { message: 'El número de parte debe contener al menos 2 caracteres.' }),
  lot_number: z.string().optional(),
  alternative_part_number: z
    .array(z.string().min(2, { message: 'Cada número de parte alterno debe contener al menos 2 caracteres.' }))
    .optional(),
  description: z.string().optional(),
  zone: z.string().optional(),
  caducate_date: z.string().optional(),
  fabrication_date: z.string().optional(),
  manufacturer_id: z.string().optional(),
  condition_id: z.string().min(1, 'Debe ingresar la condición del artículo.'),
  quantity: z.coerce.number({ message: 'Debe ingresar una cantidad.' }).min(0, { message: 'No puede ser negativo.' }),
  batch_id: z.string({ message: 'Debe ingresar un lote.' }).min(1, 'Seleccione un lote'),
  is_managed: z.boolean().optional(),
  certificate_8130: z
    .instanceof(File, { message: 'Suba un archivo válido.' })
    .refine((f) => f.size <= fileMaxBytes, 'Tamaño máximo 10 MB.')
    .optional(),
  certificate_fabricant: z
    .instanceof(File, { message: 'Suba un archivo válido.' })
    .refine((f) => f.size <= fileMaxBytes, 'Tamaño máximo 10 MB.')
    .optional(),
  certificate_vendor: z
    .instanceof(File, { message: 'Suba un archivo válido.' })
    .refine((f) => f.size <= fileMaxBytes, 'Tamaño máximo 10 MB.')
    .optional(),
  image: z.instanceof(File).optional(),
  // auxiliares para conversión secundaria
  convertion_id: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/* ----------------------------- Componente ----------------------------- */

const CreateConsumableForm = ({ initialData, isEditing }: { initialData?: EditingArticle; isEditing?: boolean }) => {
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
  const { confirmIncoming } = useConfirmIncomingArticle();

  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [secondarySelected, setSecondarySelected] = useState<Convertion | null>(null);
  const [secondaryQuantity, setSecondaryQuantity] = useState<number | undefined>();
  const [caducateDate, setCaducateDate] = useState<Date | undefined>(
    initialData?.consumable?.caducate_date ? new Date(initialData.consumable.caducate_date) : undefined,
  );
  const [fabricationDate, setFabricationDate] = useState<Date | undefined>(
    initialData?.consumable?.fabrication_date ? new Date(initialData?.consumable?.fabrication_date) : undefined,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      part_number: initialData?.part_number || '',
      alternative_part_number: initialData?.alternative_part_number || [],
      batch_id: initialData?.batches?.id?.toString() || '',
      manufacturer_id: initialData?.manufacturer?.id?.toString() || '',
      condition_id: initialData?.condition?.id?.toString() || '',
      description: initialData?.description || '',
      zone: initialData?.zone || '',
      lot_number: initialData?.consumable?.lot_number || '',
      caducate_date: initialData?.consumable?.caducate_date ? initialData?.consumable?.caducate_date : undefined,
      fabrication_date: initialData?.consumable?.fabrication_date
        ? initialData?.consumable?.fabrication_date
        : undefined,
      quantity: (initialData as any)?.quantity ?? 0,
      is_managed: (initialData as any)?.is_managed ?? true,
    },
  });

  // reset si cambia initialData
  useEffect(() => {
    if (!initialData) return;
    form.reset({
      part_number: initialData.part_number ?? '',
      alternative_part_number: initialData.alternative_part_number ?? [],
      batch_id: initialData.batches?.id?.toString() ?? '',
      manufacturer_id: initialData.manufacturer?.id?.toString() ?? '',
      condition_id: initialData.condition?.id?.toString() ?? '',
      description: initialData.description ?? '',
      zone: initialData.zone ?? '',
      lot_number: initialData.consumable?.lot_number ?? '',
      caducate_date: initialData?.consumable?.caducate_date ? initialData?.consumable?.caducate_date : undefined,
      fabrication_date: initialData?.consumable?.fabrication_date
        ? initialData?.consumable?.fabrication_date
        : undefined,
      quantity: (initialData as any)?.quantity ?? 0,
      is_managed: (initialData as any)?.is_managed ?? true,
    });
  }, [initialData, form]);

  // conversión secundaria -> quantity
  useEffect(() => {
    if (secondarySelected && typeof secondaryQuantity === 'number' && !Number.isNaN(secondaryQuantity)) {
      const qty = (secondarySelected.convertion_rate ?? 1) * (secondarySelected.quantity_unit ?? 1) * secondaryQuantity;
      form.setValue('quantity', qty, { shouldDirty: true, shouldValidate: true });
    }
  }, [secondarySelected, secondaryQuantity, form]);

  const normalizeUpper = (s?: string) => s?.trim().toUpperCase() ?? '';

  const busy =
    isBatchesLoading ||
    isManufacturerLoading ||
    isConditionsLoading ||
    createArticle.isPending ||
    confirmIncoming.isPending;

  const batchesOptions = useMemo<Batch[] | undefined>(() => batches, [batches]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedCompany?.slug) return;

    const formattedValues: FormValues & {
      caducate_date?: string;
      fabrication_date?: string;
      part_number: string;
      article_type: string;
      alternative_part_number?: string[];
    } = {
      ...values,
      part_number: normalizeUpper(values.part_number),
      article_type: 'consumible',
      alternative_part_number: values.alternative_part_number?.map((v) => normalizeUpper(v)) ?? [],
      caducate_date: caducateDate ? format(caducateDate, 'yyyy-MM-dd') : undefined,
      fabrication_date: fabricationDate ? format(fabricationDate, 'yyyy-MM-dd') : undefined,
      convertion_id: secondarySelected?.id,
    };

    if (isEditing && initialData) {
      await updateArticle.mutateAsync({
        data: {
          ...formattedValues,
        },
        id: initialData?.id,
        company: selectedCompany.slug,
      });
      router.push(`/${selectedCompany.slug}/almacen/inventario`);
    } else {
      await createArticle.mutateAsync({
        company: selectedCompany.slug,
        data: formattedValues,
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
            <FormField
              control={form.control}
              name="condition_id"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Condición</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isConditionsLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isConditionsLoading ? 'Cargando...' : 'Seleccione...'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditions?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                      {isConditionsError && (
                        <div className="p-2 text-sm text-muted-foreground">Error al cargar condiciones.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>Estado del artículo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fabrication_date"
              render={({ field }) => (
                <FormItem className="flex flex-col p-0 mt-2.5 w-full">
                  <FormLabel>Fecha de Fabricacion</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !fabricationDate && 'text-muted-foreground',
                          )}
                        >
                          {fabricationDate ? (
                            format(fabricationDate, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Select onValueChange={(value) => setFabricationDate(subYears(new Date(), parseInt(value)))}>
                        <SelectTrigger className="p-3">
                          <SelectValue placeholder="Seleccione una opcion..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="0">Actual</SelectItem> <SelectItem value="5">Ir 5 años atrás</SelectItem>
                          <SelectItem value="10">Ir 10 años atrás</SelectItem>
                          <SelectItem value="15">Ir 15 años atrás</SelectItem>
                        </SelectContent>
                      </Select>
                      <Calendar
                        locale={es}
                        mode="single"
                        selected={fabricationDate}
                        onSelect={setFabricationDate}
                        initialFocus
                        month={fabricationDate}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Fecha de creación del articulo.</FormDescription> <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caducate_date"
              render={({ field }) => (
                <FormItem className="flex flex-col p-0 mt-2.5 w-full">
                  <FormLabel>Fecha de Caducidad</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !caducateDate && 'text-muted-foreground')}
                        >
                          {caducateDate ? (
                            format(caducateDate, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Select onValueChange={(value) => setCaducateDate(addYears(new Date(), parseInt(value)))}>
                        <SelectTrigger className="p-3">
                          <SelectValue placeholder="Seleccione una opcion..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="0">Actual</SelectItem> <SelectItem value="5">5 años</SelectItem>
                          <SelectItem value="10">10 años</SelectItem> <SelectItem value="15">15 años</SelectItem>
                        </SelectContent>
                      </Select>
                      <Calendar
                        locale={es}
                        mode="single"
                        selected={caducateDate}
                        onSelect={setCaducateDate}
                        initialFocus
                        month={caducateDate}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Fecha límite del articulo.</FormDescription> <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturer_id"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fabricante</FormLabel>
                  <Select disabled={isManufacturerLoading} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturers
                        ?.filter((m) => m.type === 'PART')
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name}
                          </SelectItem>
                        ))}
                      {isManufacturerError && (
                        <div className="p-2 text-sm text-muted-foreground">Error al cargar fabricantes.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>Marca específica del artículo.</FormDescription>
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
                    <Input placeholder="Ej: Pasillo 4, repisa 3..." {...field} />
                  </FormControl>
                  <FormDescription>Zona física en almacén.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batch_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-3 mt-1.5 w-full">
                  <FormLabel>Descripción de Componente</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={isBatchesLoading || isBatchesError}
                          variant="outline"
                          role="combobox"
                          className={cn('justify-between', !field.value && 'text-muted-foreground')}
                        >
                          {isBatchesLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                          {field.value ? (
                            <p>{batches?.find((b) => `${b.id}` === field.value)?.name}</p>
                          ) : (
                            'Elegir descripción...'
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Busque una aeronave..." />
                        <CommandList>
                          <CommandEmpty className="text-xs p-2 text-center">
                            No se ha encontrado ninguna aeronave.
                          </CommandEmpty>
                          <CommandGroup>
                            {batches?.map((batch) => (
                              <CommandItem
                                value={`${batch.name}`}
                                key={batch.id}
                                onSelect={() => {
                                  form.setValue('batch_id', batch.id.toString(), { shouldValidate: true });
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    `${batch.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <p>{batch.name}</p>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Descripción del componente a registrar.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Ingreso y cantidad */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Ingreso y cantidad</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Método de ingreso (unidad secundaria) */}
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

            {/* Cantidad secundaria */}
            <div className="space-y-2">
              <FormLabel>Cantidad</FormLabel>
              <Input
                type="number"
                inputMode="decimal"
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  setSecondaryQuantity(Number.isNaN(n) ? undefined : n);
                }}
                placeholder="Ej: 2, 4, 6..."
              />
              <p className="text-sm text-muted-foreground">Cantidad según método de ingreso seleccionado.</p>
            </div>

            {/* Cantidad resultante (read-only visual, pero validada en RHF) */}
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

            {/* ¿Es manejable? */}
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

        {/* Descripción y archivos */}
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

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem>
                    <FormLabel>Imagen del artículo</FormLabel>
                    <FormControl>
                      <div className="relative h-10 w-full">
                        <FileUpIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) form.setValue('image', f, { shouldDirty: true, shouldValidate: true });
                          }}
                          className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent cursor-pointer"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Imagen descriptiva.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="certificate_8130"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        Certificado <span className="text-primary font-semibold">8130</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative h-10 w-full">
                          <FileUpIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                          <Input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) form.setValue('certificate_8130', f, { shouldDirty: true, shouldValidate: true });
                            }}
                            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent cursor-pointer"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>PDF o imagen. Máx. 10 MB.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate_fabricant"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        Certificado del <span className="text-primary">fabricante</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative h-10 w-full">
                          <FileUpIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                          <Input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f)
                                form.setValue('certificate_fabricant', f, { shouldDirty: true, shouldValidate: true });
                            }}
                            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent cursor-pointer"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>PDF o imagen. Máx. 10 MB.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate_vendor"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        Certificado del <span className="text-primary">vendedor</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative h-10 w-full">
                          <FileUpIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" />
                          <Input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f)
                                form.setValue('certificate_vendor', f, { shouldDirty: true, shouldValidate: true });
                            }}
                            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6E23DD] focus:border-transparent cursor-pointer"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>PDF o imagen. Máx. 10 MB.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descripción corta extra si necesitas más aire visual */}
        {/* <Card><CardContent>...</CardContent></Card> */}

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <Button
            className="bg-primary text-white hover:bg-blue-900 disabled:bg-slate-100 disabled:text-slate-400"
            disabled={
              busy ||
              !selectedCompany ||
              !form.getValues('part_number') ||
              !form.getValues('batch_id') ||
              createArticle.isPending ||
              updateArticle.isPending
            }
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
};

export default CreateConsumableForm;
