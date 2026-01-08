'use client';
import { useCreateRequisition, useUpdateRequisition } from '@/actions/mantenimiento/compras/requisiciones/actions';
import { CreateBatchDialog } from '@/components/dialogs/mantenimiento/almacen/CreateBatchDialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAircrafts } from '@/hooks/aerolinea/aeronaves/useGetAircrafts';
import { useGetSecondaryUnits } from '@/hooks/general/unidades/useGetSecondaryUnits';
import { useGetBatchesByLocationId } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByLocationId';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Employee } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  ChevronsUpDown,
  FileText,
  Loader2,
  MinusCircle,
  Trash2,
  Upload,
  AlertCircle,
  Clock,
  Flag,
  CircleHelp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// Actualizar el esquema de validación
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
    .refine((files) => files.every((file) => file.size <= 5 * 1024 * 1024), 'Cada archivo PDF debe ser menor a 5MB')
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
      {
        message: 'La unidad secundaria es obligatoria para consumibles',
        path: ['articles'],
      },
    ),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  onClose: () => void;
  initialData?: FormSchemaType;
  id?: number | string;
  isEditing?: boolean;
}

// Tipos para batches y artículos
interface Article {
  part_number: string;
  quantity: number;
  unit?: string;
}

interface Batch {
  batch: string;
  category: string;
  batch_name: string;
  batch_articles: Article[];
}

// Componente de prioridad con iconos
const PriorityBadge = ({ priority }: { priority: 'low' | 'medium' | 'high' }) => {
  const config = {
    low: {
      label: 'Baja',
      icon: <Clock className="h-3 w-3" />,
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    },
    medium: {
      label: 'Media',
      icon: <Flag className="h-3 w-3" />,
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    },
    high: {
      label: 'Alta',
      icon: <AlertCircle className="h-3 w-3" />,
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
  };

  const { label, icon, className } = config[priority];

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-normal', className)}>
      {icon}
      {label}
    </Badge>
  );
};

export function CreateWarehouseRequisitionForm({ onClose, initialData, isEditing, id }: FormProps) {
  const { user } = useAuth();
  const { mutate, data, isPending: isBatchesLoading } = useGetBatchesByLocationId();
  const { selectedCompany, selectedStation } = useCompanyStore();
  const { data: secondaryUnits, isLoading: secondaryUnitLoading } = useGetSecondaryUnits();
  const { createRequisition } = useCreateRequisition();
  const { updateRequisition } = useUpdateRequisition();

  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);
  const [requestBy, setRequestedBy] = useState<Employee | null>(null);
  const [openRequestedBy, setOpenRequestedBy] = useState(false);

  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetAircrafts(selectedCompany?.slug);

  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useGetEmployeesByDepartment('MANP');

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      articles: [],
      priority: 'medium',
      is_referred: false,
    },
  });

  useEffect(() => {
    if (user && selectedCompany && selectedStation) {
      form.setValue('created_by', user.id.toString());
    }
    if (initialData && selectedCompany) {
      form.reset(initialData);
    }
  }, [user, initialData, form, selectedCompany, selectedStation]);

  useEffect(() => {
    if (selectedStation) {
      mutate({ location_id: Number(selectedStation), company: selectedCompany?.slug });
    }
  }, [selectedStation, mutate, selectedCompany]);

  useEffect(() => {
    form.setValue('articles', selectedBatches);
  }, [selectedBatches, form]);

  const handleBatchSelect = (batchName: string, batchId: string, batch_category: string) => {
    setSelectedBatches((prev) => {
      const exists = prev.some((b) => b.batch === batchId);
      if (exists) {
        return prev.filter((b) => b.batch !== batchId);
      }
      return [
        ...prev,
        {
          batch: batchId,
          batch_name: batchName,
          category: batch_category,
          batch_articles: [{ part_number: '', quantity: 0 }],
        },
      ];
    });
  };

  const handleArticleChange = (
    batchName: string,
    index: number,
    field: string,
    value: string | number | File | undefined,
  ) => {
    setSelectedBatches((prev) =>
      prev.map((batch) =>
        batch.batch === batchName
          ? {
              ...batch,
              batch_articles: batch.batch_articles.map((article, i) =>
                i === index ? { ...article, [field]: value } : article,
              ),
            }
          : batch,
      ),
    );
  };

  const addArticle = (batchName: string) => {
    setSelectedBatches((prev) =>
      prev.map((batch) =>
        batch.batch === batchName
          ? {
              ...batch,
              batch_articles: [...batch.batch_articles, { part_number: '', quantity: 0 }],
            }
          : batch,
      ),
    );
  };

  const removeArticleFromBatch = (batchName: string, articleIndex: number) => {
    setSelectedBatches((prevBatches) =>
      prevBatches.map((batch) =>
        batch.batch === batchName
          ? {
              ...batch,
              batch_articles: batch.batch_articles.filter((_, index) => index !== articleIndex),
            }
          : batch,
      ),
    );
  };

  const removeBatch = (batchName: string) => {
    setSelectedBatches((prevBatches) => prevBatches.filter((batch) => batch.batch !== batchName));
  };

  const onSubmit = async (data: FormSchemaType) => {
    const formattedData = {
      ...data,
      type: 'WAREHOUSE',
      location_id: Number(selectedStation),
      company: selectedCompany!.slug,
    };
    if (isEditing) {
      await updateRequisition.mutateAsync({ id: id!, data: formattedData, company: selectedCompany!.slug });
    } else {
      await createRequisition.mutateAsync({ data: formattedData, company: selectedCompany!.slug });
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-4">
        {/* Sección de información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="work_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Orden de Trabajo</FormLabel>
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
                          'w-full h-9 justify-between font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {isAircraftsLoading && <Loader2 className="size-3.5 animate-spin mr-2" />}
                        {field.value
                          ? aircrafts?.find((aircraft) => aircraft.id.toString() === field.value)?.acronym
                          : 'Seleccionar aeronave'}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar aeronave..." className="h-9" />
                      <CommandList>
                        <CommandEmpty className="py-2 text-xs text-center">
                          No se ha encontrado ninguna aeronave.
                        </CommandEmpty>
                        <CommandGroup>
                          {aircrafts?.map((aircraft) => (
                            <CommandItem
                              value={aircraft.id.toString()}
                              key={aircraft.id}
                              onSelect={() => {
                                form.setValue('aircraft_id', aircraft.id.toString());
                              }}
                              className="py-2 text-sm"
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-3.5 w-3.5',
                                  aircraft.id.toString() === field.value ? 'opacity-100' : 'opacity-0',
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

        {/* Sección de prioridad y referido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Prioridad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue>
                        {field.value ? (
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={field.value} />
                          </div>
                        ) : (
                          'Seleccionar prioridad'
                        )}
                      </SelectValue>
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    <CircleHelp className="h-3.5 w-3.5" />
                    ¿Es referido?
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">Marcar si esta requisición está referida</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Responsable */}
        <FormField
          control={form.control}
          name="requested_by"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Empleado Responsable</FormLabel>
              <Popover open={openRequestedBy} onOpenChange={setOpenRequestedBy}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={employeesLoading || employeesError}
                    variant="outline"
                    role="combobox"
                    aria-expanded={openRequestedBy}
                    className="w-full h-9 justify-between font-normal"
                  >
                    {requestBy
                      ? `${requestBy.first_name} ${requestBy.last_name}`
                      : (() => {
                          const dni = field.value;
                          const found = employees?.find((e) => String(e.dni) === String(dni));
                          return found ? `${found.first_name} ${found.last_name}` : 'Seleccionar técnico';
                        })()}
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar técnico..." className="h-9" />
                    <CommandList>
                      <CommandEmpty className="py-2 text-xs text-center">No se han encontrado técnicos...</CommandEmpty>
                      <CommandGroup>
                        {employees?.map((e) => (
                          <CommandItem
                            value={`${e.first_name} ${e.last_name} ${e.dni}`}
                            key={e.id}
                            onSelect={() => {
                              setRequestedBy(e);
                              form.setValue('requested_by', String(e.dni), { shouldValidate: true, shouldDirty: true });
                              setOpenRequestedBy(false);
                            }}
                            className="py-2 text-sm"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-3.5 w-3.5',
                                String(requestBy?.dni ?? field.value) === String(e.dni) ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {`${e.first_name} ${e.last_name}`}
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

        {/* Artículos */}
        <FormField
          control={form.control}
          name="articles"
          render={({ field }: { field: any }) => (
            <FormItem>
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-sm font-medium">Artículos</FormLabel>
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
                        'w-full h-9 justify-between font-normal',
                        selectedBatches.length === 0 && 'text-muted-foreground',
                      )}
                    >
                      {selectedBatches.length > 0
                        ? `${selectedBatches.length} renglón(es) seleccionado(s)`
                        : 'Seleccionar renglones...'}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar renglones..." className="h-9" />
                    <CommandList>
                      <CommandEmpty className="py-2 text-xs text-center">No existen renglones...</CommandEmpty>
                      <CommandGroup>
                        {data?.map((batch) => (
                          <CommandItem
                            key={batch.name}
                            value={batch.name}
                            onSelect={() => handleBatchSelect(batch.name, batch.id.toString(), batch.category)}
                            className="py-2 text-sm"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-3.5 w-3.5',
                                selectedBatches.some((b) => b.batch === batch.id.toString())
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {batch.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Lista de batches seleccionados */}
              {selectedBatches.length > 0 && (
                <div className="mt-3 space-y-3">
                  <ScrollArea className={cn('', selectedBatches.length > 2 ? 'h-[250px]' : '')}>
                    {selectedBatches.map((batch) => (
                      <div key={batch.batch} className="mb-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{batch.batch_name}</h4>
                          <Button
                            variant="ghost"
                            type="button"
                            size="sm"
                            onClick={() => removeBatch(batch.batch)}
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <MinusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {batch.batch_articles.map((article, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                              <Input
                                placeholder="Número de parte"
                                value={article.part_number}
                                onChange={(e) => handleArticleChange(batch.batch, index, 'part_number', e.target.value)}
                                className="h-8 text-sm"
                              />
                              {batch.category === 'consumible' && (
                                <Select
                                  disabled={secondaryUnitLoading}
                                  onValueChange={(value) => handleArticleChange(batch.batch, index, 'unit', value)}
                                  value={article.unit}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Unidad Sec." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {secondaryUnits?.map((secU) => (
                                      <SelectItem key={secU.id} value={secU.id.toString()} className="text-sm">
                                        {secU.secondary_unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}

                              <Input
                                type="number"
                                placeholder="Cantidad"
                                value={article.quantity || ''}
                                onChange={(e) =>
                                  handleArticleChange(batch.batch, index, 'quantity', Number(e.target.value))
                                }
                                className="h-8 text-sm"
                              />

                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="cursor-pointer h-8 text-xs"
                                  onChange={(e) =>
                                    handleArticleChange(batch.batch, index, 'image', e.target.files?.[0])
                                  }
                                />

                                <Button
                                  variant="ghost"
                                  type="button"
                                  size="sm"
                                  onClick={() => removeArticleFromBatch(batch.batch, index)}
                                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <MinusCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addArticle(batch.batch)}
                          className="mt-2 text-xs h-7"
                        >
                          + Agregar artículo
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Justificación */}
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
                  className="min-h-[80px] text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Documentos */}
        <FormField
          control={form.control}
          name="document"
          render={({ field }) => {
            const files = field.value || [];

            const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const selectedFiles = e.target.files;
              if (selectedFiles) {
                const fileArray = Array.from(selectedFiles);
                const pdfFiles = fileArray.filter(
                  (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
                );
                const validFiles = pdfFiles.filter((file) => file.size <= 5 * 1024 * 1024);

                fileArray.forEach((file) => {
                  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                  const isSizeValid = file.size <= 5 * 1024 * 1024;

                  if (!isPDF) {
                    alert(`"${file.name}" no es un PDF y será ignorado.`);
                  } else if (!isSizeValid) {
                    alert(`"${file.name}" excede el límite de 5MB.`);
                  }
                });

                if (validFiles.length > 0) {
                  const newFiles = [...files, ...validFiles];
                  field.onChange(newFiles);
                }
              }
              e.target.value = '';
            };

            return (
              <FormItem>
                <FormLabel className="text-sm font-medium">Documentos Adjuntos</FormLabel>

                <div className="space-y-3">
                  {/* Área de carga */}
                  <div className="border border-dashed border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <FormControl>
                            <Input
                              type="file"
                              multiple
                              accept=".pdf,application/pdf"
                              onChange={handleFileChange}
                              className="cursor-pointer border-0 h-auto p-0"
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500 mt-1">
                            Haga clic o arrastre archivos PDF (máx. 5MB cada uno)
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Lista de archivos */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Archivos ({files.length})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange([])}
                          className="text-red-600 hover:text-red-700 h-7 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Limpiar
                        </Button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {files.map((file: File, index: number) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB • PDF</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedFiles = files.filter((_: File, i: number) => i !== index);
                                field.onChange(updatedFiles);
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            );
          }}
        />

        {/* Separador y botón de envío */}
        <div className="flex items-center gap-3 pt-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">SIGEAC</span>
          <Separator className="flex-1" />
        </div>

        <Button type="submit" disabled={createRequisition.isPending || updateRequisition.isPending} className="mt-2">
          {isEditing ? 'Actualizar Requisición' : 'Generar Requisición'}
          {(createRequisition.isPending || updateRequisition.isPending) && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          )}
        </Button>
      </form>
    </Form>
  );
}
