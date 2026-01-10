'use client';

import { useCreateRequisition, useUpdateRequisition } from '@/actions/mantenimiento/compras/requisiciones/actions';
import { CreateBatchDialog } from '@/components/dialogs/mantenimiento/almacen/CreateBatchDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAircrafts } from '@/hooks/aerolinea/aeronaves/useGetAircrafts';
import { useGetSecondaryUnits } from '@/hooks/general/unidades/useGetSecondaryUnits';
import { useGetBatchesByLocationId } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByLocationId';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import type { Employee } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Clock,
  FileText,
  Flag,
  Loader2,
  MinusCircle,
  Trash2,
  Upload,
} from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

/* =========================
  Schema
========================= */
const MAX_PDF_MB = 5;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

const FormSchema = z.object({
  justification: z
    .string({ message: 'La justificación debe ser válida.' })
    .min(2, { message: 'La justificación debe ser válida.' }),
  aircraft_id: z.string().optional(),
  work_order: z.string().optional(),
  created_by: z.string(),
  requested_by: z.string({ message: 'Debe ingresar quien lo solicita.' }),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  is_referred: z.boolean().default(false),
  document: z
    .array(z.instanceof(File))
    .refine(
      (files) => files.every((file) => file.size <= MAX_PDF_BYTES),
      `Cada archivo PDF debe ser menor a ${MAX_PDF_MB}MB`,
    )
    .refine((files) => files.every((file) => file.type === 'application/pdf'), 'Solo se permiten archivos PDF')
    .optional(),
  articles: z
    .array(
      z.object({
        batch: z.string(),
        batch_name: z.string(),
        category: z.string(),
        batch_articles: z.array(
          z.object({
            part_number: z.string().min(1, 'El número de parte es obligatorio'),
            alt_part_number: z.string().min(1, 'El número de parte es obligatorio').optional(),
            quantity: z.number().min(1, 'Debe ingresar una cantidad válida'),
            image: z.any().optional(),
            unit: z.string().optional(),
          }),
        ),
      }),
    )
    .refine(
      (articles) =>
        articles.every((batch) =>
          batch.batch_articles.every((article) => batch.category !== 'consumible' || article.unit),
        ),
      { message: 'La unidad secundaria es obligatoria para consumibles', path: ['articles'] },
    ),
});

type FormSchemaType = z.infer<typeof FormSchema>;

/* =========================
  Local types
========================= */
type Priority = 'low' | 'medium' | 'high';

interface Article {
  part_number: string;
  alt_part_number?: string;
  quantity: number;
  image?: File;
  unit?: string;
}

interface Batch {
  batch: string;
  category: string;
  batch_name: string;
  batch_articles: Article[];
}

interface FormProps {
  onClose: () => void;
  initialData?: FormSchemaType;
  id?: number | string;
  isEditing?: boolean;
}

/* =========================
  UI atoms
========================= */
const PriorityBadge = memo(({ priority }: { priority: Priority }) => {
  const config = {
    low: { label: 'Baja', icon: <Clock className="h-3 w-3" />, className: 'bg-muted text-foreground' },
    medium: {
      label: 'Media',
      icon: <Flag className="h-3 w-3" />,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    high: {
      label: 'Alta',
      icon: <AlertCircle className="h-3 w-3" />,
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  } satisfies Record<Priority, { label: string; icon: React.ReactNode; className: string }>;

  const { label, icon, className } = config[priority];

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-normal', className)}>
      {icon}
      {label}
    </Badge>
  );
});
PriorityBadge.displayName = 'PriorityBadge';

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

const formatKB = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const emptyArticle = (): Article => ({ part_number: '', quantity: 1 });

/* =========================
  Main
========================= */
export function CreateWarehouseRequisitionForm({ onClose, initialData, isEditing, id }: FormProps) {
  const { user } = useAuth();
  const { mutate, data: batches, isPending: isBatchesLoading } = useGetBatchesByLocationId();
  const { selectedCompany, selectedStation } = useCompanyStore();
  const { data: secondaryUnits, isLoading: secondaryUnitLoading } = useGetSecondaryUnits();
  const { createRequisition } = useCreateRequisition();
  const { updateRequisition } = useUpdateRequisition();

  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);
  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [requestedByObj, setRequestedByObj] = useState<Employee | null>(null);

  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetAircrafts(selectedCompany?.slug);
  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useGetEmployeesByDepartment('MANP');

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      work_order: '',
      aircraft_id: undefined,
      justification: '',
      created_by: '',
      requested_by: '',
      priority: 'medium',
      is_referred: false,
      articles: [],
      document: [],
    },
    mode: 'onChange',
  });

  const isSubmitting = createRequisition.isPending || updateRequisition.isPending;

  /* ---------- Derived labels ---------- */
  const aircraftLabel = useMemo(() => {
    const id = form.getValues('aircraft_id');
    if (!id) return 'Seleccionar aeronave';
    const found = aircrafts?.find((a) => String(a.id) === String(id));
    return found?.acronym ?? 'Seleccionar aeronave';
  }, [aircrafts, form]);

  const requestedByLabel = useMemo(() => {
    const dni = form.getValues('requested_by');
    if (requestedByObj) return `${requestedByObj.first_name} ${requestedByObj.last_name}`;
    const found = employees?.find((e) => String(e.dni) === String(dni));
    return found ? `${found.first_name} ${found.last_name}` : 'Seleccionar técnico';
  }, [employees, form, requestedByObj]);

  const batchesButtonLabel = useMemo(() => {
    if (selectedBatches.length === 0) return 'Seleccionar renglones...';
    return `${selectedBatches.length} renglón(es) seleccionado(s)`;
  }, [selectedBatches.length]);

  /* ---------- Effects ---------- */
  useEffect(() => {
    if (user?.id) form.setValue('created_by', String(user.id), { shouldDirty: false });
  }, [user, form]);

  useEffect(() => {
    if (!selectedStation || !selectedCompany?.slug) return;
    mutate({ location_id: Number(selectedStation), company: selectedCompany.slug });
  }, [selectedStation, selectedCompany?.slug, mutate]);

  useEffect(() => {
    form.setValue('articles', selectedBatches as any, { shouldValidate: true, shouldDirty: true });
  }, [selectedBatches, form]);

  useEffect(() => {
    if (!initialData) return;

    form.reset(initialData);
    const incoming = (initialData.articles ?? []) as unknown as Batch[];
    setSelectedBatches(incoming);

    // Intentar hidratar el empleado seleccionado cuando llegue employees
    const dni = initialData.requested_by;
    const found = employees?.find((e) => String(e.dni) === String(dni));
    if (found) setRequestedByObj(found);
  }, [initialData, form, employees]);

  /* ---------- Handlers ---------- */
  const handleBatchSelect = useCallback((batchName: string, batchId: string, batchCategory: string) => {
    setSelectedBatches((prev) => {
      const exists = prev.some((b) => b.batch === batchId);
      if (exists) return prev.filter((b) => b.batch !== batchId);

      return [
        ...prev,
        {
          batch: batchId,
          batch_name: batchName,
          category: batchCategory,
          batch_articles: [emptyArticle()],
        },
      ];
    });
  }, []);

  const handleArticleChange = useCallback(
    (batchId: string, index: number, field: keyof Article, value: Article[keyof Article]) => {
      setSelectedBatches((prev) =>
        prev.map((batch) =>
          batch.batch === batchId
            ? {
                ...batch,
                batch_articles: batch.batch_articles.map((article, i) =>
                  i === index ? { ...article, [field]: value } : article,
                ),
              }
            : batch,
        ),
      );
    },
    [],
  );

  const addArticle = useCallback((batchId: string) => {
    setSelectedBatches((prev) =>
      prev.map((batch) =>
        batch.batch === batchId ? { ...batch, batch_articles: [...batch.batch_articles, emptyArticle()] } : batch,
      ),
    );
  }, []);

  const removeArticleFromBatch = useCallback((batchId: string, articleIndex: number) => {
    setSelectedBatches((prev) =>
      prev.map((batch) =>
        batch.batch === batchId
          ? { ...batch, batch_articles: batch.batch_articles.filter((_, i) => i !== articleIndex) }
          : batch,
      ),
    );
  }, []);

  const removeBatch = useCallback((batchId: string) => {
    setSelectedBatches((prev) => prev.filter((b) => b.batch !== batchId));
  }, []);

  const onSubmit = useCallback(
    async (values: FormSchemaType) => {
      if (!selectedCompany?.slug || !selectedStation) return;

      const formattedData = {
        ...values,
        type: 'WAREHOUSE',
        location_id: Number(selectedStation),
        company: selectedCompany.slug,
      };

      try {
        if (isEditing) {
          await updateRequisition.mutateAsync({ id: id!, data: formattedData, company: selectedCompany.slug });
        } else {
          await createRequisition.mutateAsync({ data: formattedData, company: selectedCompany.slug });
        }
        onClose();
      } catch (e) {
        // Mantengo lógica de flujo. Si tu app ya muestra toast global, esto evita cerrar el modal en error.
        console.error(e);
      }
    },
    [selectedCompany?.slug, selectedStation, isEditing, id, updateRequisition, createRequisition, onClose],
  );

  /* ---------- Documents field helper ---------- */
  const handleDocumentsPick = useCallback(
    (incomingFiles: FileList | null, currentFiles: File[], onChange: (files: File[]) => void) => {
      if (!incomingFiles) return;

      const fileArray = Array.from(incomingFiles);

      const rejected: string[] = [];
      const accepted = fileArray.filter((file) => {
        const okType = isPdf(file);
        const okSize = file.size <= MAX_PDF_BYTES;
        if (!okType) rejected.push(`"${file.name}" no es PDF.`);
        else if (!okSize) rejected.push(`"${file.name}" excede ${MAX_PDF_MB}MB.`);
        return okType && okSize;
      });

      if (rejected.length > 0) {
        form.setError('document', { type: 'manual', message: rejected.join(' ') });
      } else {
        form.clearErrors('document');
      }

      if (accepted.length > 0) onChange([...currentFiles, ...accepted]);
    },
    [form],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Estado de carga / error sutil */}
        {(isAircraftsError || employeesError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Hubo un problema cargando catálogos. Intenta recargar o verifica tu conexión.
          </div>
        )}

        <Section title="Información básica" hint="Completa lo mínimo necesario para identificar la requisición.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="work_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Orden de trabajo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: OT-2024-001" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aircraft_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Aeronave</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={isAircraftsLoading}
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'h-9 w-full justify-between font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {isAircraftsLoading ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
                          {aircraftLabel}
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-[260px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar aeronave..." className="h-9" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-center text-xs">
                            No se ha encontrado ninguna aeronave.
                          </CommandEmpty>
                          <CommandGroup>
                            {aircrafts?.map((aircraft) => (
                              <CommandItem
                                value={String(aircraft.id)}
                                key={aircraft.id}
                                onSelect={() =>
                                  form.setValue('aircraft_id', String(aircraft.id), { shouldDirty: true })
                                }
                                className="py-2 text-sm"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-3.5 w-3.5',
                                    String(aircraft.id) === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {aircraft.acronym}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Section>

        <Section title="Prioridad y referencia" hint="Ajusta la urgencia y marca si aplica un flujo referido.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2 py-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Baja</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2 py-1">
                          <Flag className="h-3.5 w-3.5" />
                          <span>Media</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2 py-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Alta</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_referred"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">¿Es referido?</FormLabel>
                    <p className="text-xs text-muted-foreground">Actívalo si la requisición tiene referencia previa.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Section>

        <Section title="Responsable" hint="Selecciona el técnico responsable de la solicitud.">
          <FormField
            control={form.control}
            name="requested_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Empleado responsable</FormLabel>
                <Popover open={openRequestedBy} onOpenChange={setOpenRequestedBy}>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={employeesLoading || employeesError}
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRequestedBy}
                      className="h-9 w-full justify-between font-normal"
                    >
                      {requestedByLabel}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar técnico..." className="h-9" />
                      <CommandList>
                        <CommandEmpty className="py-2 text-center text-xs">
                          No se han encontrado técnicos...
                        </CommandEmpty>
                        <CommandGroup>
                          {employees?.map((e) => (
                            <CommandItem
                              value={`${e.first_name} ${e.last_name} ${e.dni}`}
                              key={e.id}
                              onSelect={() => {
                                setRequestedByObj(e);
                                form.setValue('requested_by', String(e.dni), {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                                setOpenRequestedBy(false);
                              }}
                              className="py-2 text-sm"
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-3.5 w-3.5',
                                  String((requestedByObj?.dni ?? field.value) || '') === String(e.dni)
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              {`${e.first_name} ${e.last_name}`}
                              <span className="ml-auto text-xs text-muted-foreground">{e.dni}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </Section>

        <Section
          title="Artículos"
          hint="Selecciona renglones y registra los artículos. Consumibles requieren unidad secundaria."
        >
          <FormField
            control={form.control}
            name="articles"
            render={() => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="text-sm font-medium">Renglones</FormLabel>
                  <CreateBatchDialog />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isBatchesLoading}
                        role="combobox"
                        className={cn(
                          'h-9 w-full justify-between font-normal',
                          selectedBatches.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        {isBatchesLoading ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
                        {batchesButtonLabel}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar renglones..." className="h-9" />
                      <CommandList>
                        <CommandEmpty className="py-2 text-center text-xs">No existen renglones...</CommandEmpty>
                        <CommandGroup>
                          {batches?.map((batch) => {
                            const active = selectedBatches.some((b) => b.batch === String(batch.id));
                            return (
                              <CommandItem
                                key={batch.id}
                                value={batch.name}
                                onSelect={() => handleBatchSelect(batch.name, String(batch.id), batch.category)}
                                className="py-2 text-sm"
                              >
                                <Check className={cn('mr-2 h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-0')} />
                                <span className="truncate">{batch.name}</span>
                                <Badge variant="secondary" className="ml-auto text-[11px] font-normal">
                                  {batch.category}
                                </Badge>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedBatches.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    <ScrollArea className={cn(selectedBatches.length > 2 ? 'h-[270px]' : '')}>
                      <div className="space-y-3 pr-3">
                        {selectedBatches.map((batch) => (
                          <div key={batch.batch} className="rounded-2xl border bg-card p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="truncate text-sm font-semibold">{batch.batch_name}</h4>
                                  <Badge variant="outline" className="text-[11px] font-normal">
                                    {batch.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {batch.batch_articles.length} item(s)
                                  </span>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                type="button"
                                size="sm"
                                onClick={() => removeBatch(batch.batch)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                aria-label="Eliminar renglón"
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-3 space-y-2">
                              {batch.batch_articles.map((article, index) => (
                                <div
                                  key={`${batch.batch}-${index}`}
                                  className="grid grid-cols-1 gap-2 md:grid-cols-5 md:items-center"
                                >
                                  <Input
                                    placeholder="Número de parte"
                                    value={article.part_number}
                                    onChange={(e) =>
                                      handleArticleChange(batch.batch, index, 'part_number', e.target.value)
                                    }
                                    className="h-9 text-sm w-full"
                                  />

                                  {batch.category === 'consumible' ? (
                                    <Select
                                      disabled={secondaryUnitLoading}
                                      onValueChange={(value) => handleArticleChange(batch.batch, index, 'unit', value)}
                                      value={article.unit}
                                    >
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Unidad sec." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {secondaryUnits?.map((secU) => (
                                          <SelectItem key={secU.id} value={String(secU.id)} className="text-sm">
                                            {secU.secondary_unit}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="hidden md:block" />
                                  )}

                                  <Input
                                    type="number"
                                    min={1}
                                    placeholder="Cantidad"
                                    value={article.quantity || ''}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const qty = raw === '' ? 0 : Number(raw);
                                      handleArticleChange(batch.batch, index, 'quantity', qty);
                                    }}
                                    className="h-9 text-sm"
                                  />

                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      className="h-9 cursor-pointer text-xs"
                                      onChange={(e) =>
                                        handleArticleChange(batch.batch, index, 'image', e.target.files?.[0])
                                      }
                                    />
                                    <Button
                                      variant="ghost"
                                      type="button"
                                      size="sm"
                                      onClick={() => removeArticleFromBatch(batch.batch, index)}
                                      className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                                      aria-label="Eliminar artículo"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addArticle(batch.batch)}
                              className="mt-3 h-9 text-xs"
                            >
                              + Agregar artículo
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : null}

                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </Section>

        <Section title="Justificación" hint="Explica el motivo con el contexto mínimo necesario.">
          <FormField
            control={form.control}
            name="justification"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Justificación</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describa la necesidad de los materiales..."
                    {...field}
                    className="min-h-[92px] text-sm"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </Section>

        <Section title="Documentos adjuntos" hint={`Solo PDF, máximo ${MAX_PDF_MB}MB por archivo.`}>
          <FormField
            control={form.control}
            name="document"
            render={({ field }) => {
              const files = field.value || [];

              return (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Adjuntar PDFs</FormLabel>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-dashed p-3 transition-colors hover:border-muted-foreground/40">
                      <label className="cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl border bg-muted/30 p-2">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="flex-1">
                            <FormControl>
                              <Input
                                type="file"
                                multiple
                                accept=".pdf,application/pdf"
                                onChange={(e) => {
                                  handleDocumentsPick(e.target.files, files, field.onChange);
                                  e.target.value = '';
                                }}
                                className="cursor-pointer border-0 p-0"
                              />
                            </FormControl>
                            <p className="mt-1 text-xs text-muted-foreground">Selecciona uno o más archivos.</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {files.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Archivos ({files.length})</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange([])}
                            className="h-8 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Limpiar
                          </Button>
                        </div>

                        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                          {files.map((file: File, index: number) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between rounded-xl border p-2 hover:bg-muted/30"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatKB(file.size)} • PDF</p>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => field.onChange(files.filter((_, i) => i !== index))}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                aria-label="Eliminar archivo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <FormMessage className="text-xs" />
                </FormItem>
              );
            }}
          />
        </Section>

        <div className="flex items-center gap-3 pt-1">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">SIGEAC</span>
          <Separator className="flex-1" />
        </div>

        <div className="sticky bottom-0 z-10 rounded-2xl border bg-background/80 p-3 backdrop-blur">
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="h-9" disabled={isSubmitting}>
              Cancelar
            </Button>

            <Button type="submit" disabled={isSubmitting} className="h-9">
              {isEditing ? 'Actualizar requisición' : 'Generar requisición'}
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
