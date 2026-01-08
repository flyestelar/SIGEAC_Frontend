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
  ChevronDown,
  ChevronsUpDown,
  FileText,
  Loader2,
  MinusCircle,
  PlusCircle,
  Trash2,
  Upload,
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
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, AlertCircle, Link2 } from 'lucide-react';

const FormSchema = z.object({
  justification: z
    .string({ message: 'La justificación debe ser válida.' })
    .min(2, { message: 'La justificación debe ser válida.' }),

  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Debe seleccionar una prioridad',
  }),
  is_referred: z.boolean().optional(),
  aircraft_id: z.string().optional(),
  work_order: z.string().optional(),
  created_by: z.string(),
  requested_by: z.string({ message: 'Debe ingresar quien lo solicita.' }),
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
            unit: z.string().optional(), // Inicialmente opcional
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

const PRIORITY_CONFIG = {
  low: {
    label: 'Baja',
    icon: ArrowDown,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  medium: {
    label: 'Media',
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  high: {
    label: 'Alta',
    icon: ArrowUp,
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

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
  _open?: boolean;
}

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
      //form.setValue('company', selectedCompany.slug);
      //form.setValue('location_id', selectedStation);
    }
    if (initialData && selectedCompany) {
      form.reset(initialData); // Set initial form values
      //form.setValue('company', selectedCompany.slug);
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

  // Maneja la selección de un lote.
  const handleBatchSelect = (batchName: string, batchId: string, batch_category: string) => {
    setSelectedBatches((prev) => {
      // Verificar si el batch ya está seleccionado
      const exists = prev.some((b) => b.batch === batchId);

      if (exists) {
        // Si ya existe, lo eliminamos
        return prev.filter((b) => b.batch !== batchId);
      }

      // Si no existe, lo agregamos
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

  // Maneja el cambio en un artículo.
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

  // Agrega un nuevo artículo a un lote.
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="work_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº Orden de Trabajo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: 281025-B1-01" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requested_by"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5 w-full">
                <FormLabel>Empleado Responsable</FormLabel>
                <Popover open={openRequestedBy} onOpenChange={setOpenRequestedBy}>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={employeesLoading || employeesError}
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRequestedBy}
                      className="justify-between"
                    >
                      {requestBy
                        ? `${requestBy.first_name} ${requestBy.last_name}`
                        : (() => {
                            const dni = field.value;
                            const found = employees?.find((e) => String(e.dni) === String(dni));
                            return found ? `${found.first_name} ${found.last_name}` : 'Selec. el técnico';
                          })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Selec. el técnico..." />
                      <CommandList>
                        <CommandEmpty>No se han encontrado técnicos...</CommandEmpty>
                        {employees?.map((e) => (
                          <CommandItem
                            value={`${e.first_name} ${e.last_name} ${e.dni}`}
                            key={e.id}
                            onSelect={() => {
                              setRequestedBy(e);
                              form.setValue('requested_by', String(e.dni), { shouldValidate: true, shouldDirty: true });
                              setOpenRequestedBy(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                String(requestBy?.dni ?? field.value) === String(e.dni) ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {`${e.first_name} ${e.last_name}`}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aircraft_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aeronave</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isAircraftsLoading || isAircraftsError}>
                      <SelectValue placeholder="Seleccioe la aeronave..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {aircrafts &&
                      aircrafts.map((aircraft) => (
                        <SelectItem key={aircraft.id} value={aircraft.id.toString()}>
                          {aircraft.acronym} - {aircraft.serial}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />{' '}
        </div>
        <div className="flex flex-wrap gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => {
              const config = PRIORITY_CONFIG[field.value];
              const Icon = config.icon;

              return (
                <FormItem className="w-[240px] rounded-xl border bg-muted/30 p-4 space-y-3">
                  <FormLabel>Prioridad</FormLabel>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={field.value}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold',
                        config.className,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </motion.div>
                  </AnimatePresence>

                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                        const Ico = cfg.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Ico className="h-4 w-4" />
                              {cfg.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="is_referred"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 rounded-xl border p-4 bg-background shadow-sm mt-6">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </FormControl>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <FormLabel className="mb-0">Solicitud referida</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4 space-y-4">
          <AnimatePresence>
            {selectedBatches.map((batch) => (
              <motion.div
                key={batch.batch}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border bg-background shadow-sm"
              >
                {/* ================= HEADER ================= */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40"
                  onClick={() =>
                    setSelectedBatches((prev) =>
                      prev.map((b) => (b.batch === batch.batch ? { ...b, _open: !b._open } : b)),
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown className={cn('h-4 w-4 transition-transform', batch._open && 'rotate-180')} />
                    <div>
                      <p className="font-semibold">{batch.batch_name}</p>
                      <p className="text-xs text-muted-foreground">{batch.batch_articles.length} artículo(s)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        addArticle(batch.batch);
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBatch(batch.batch);
                      }}
                      className="hover:text-red-500"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* ================= BODY ================= */}
                <AnimatePresence>
                  {batch._open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t"
                    >
                      <ScrollArea className={cn('px-4 py-3', batch.batch_articles.length > 3 && 'h-[260px]')}>
                        <div className="space-y-3">
                          {batch.batch_articles.map((article, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-center rounded-lg border p-3">
                              <Input
                                className="col-span-3"
                                placeholder="N° Parte"
                                onChange={(e) => handleArticleChange(batch.batch, index, 'part_number', e.target.value)}
                              />

                              <Input
                                className="col-span-3"
                                placeholder="N/P Alterno"
                                onChange={(e) =>
                                  handleArticleChange(batch.batch, index, 'alt_part_number', e.target.value)
                                }
                              />

                              <Select onValueChange={(value) => handleArticleChange(batch.batch, index, 'unit', value)}>
                                <SelectTrigger className="col-span-2">
                                  <SelectValue placeholder="Unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                  {secondaryUnits?.map((secU) => (
                                    <SelectItem key={secU.id} value={secU.id.toString()}>
                                      {secU.secondary_unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                className="col-span-2"
                                type="number"
                                placeholder="Cant."
                                onChange={(e) =>
                                  handleArticleChange(batch.batch, index, 'quantity', Number(e.target.value))
                                }
                              />

                              <Input
                                className="col-span-1"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleArticleChange(batch.batch, index, 'image', e.target.files?.[0])}
                              />

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeArticleFromBatch(batch.batch, index)}
                                className="col-span-1 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificación</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Necesidad de la pieza X para instalación..." {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="document"
          render={({ field }) => {
            // Asegurarnos de que siempre trabajemos con un array
            const files = field.value || [];

            // Función para manejar la selección con validación
            const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const selectedFiles = e.target.files;
              if (selectedFiles) {
                const fileArray = Array.from(selectedFiles);

                // Validar que sean PDFs
                const pdfFiles = fileArray.filter(
                  (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
                );

                // Validar tamaño (5MB)
                const validFiles = pdfFiles.filter((file) => file.size <= 5 * 1024 * 1024);

                // Mostrar alertas para archivos inválidos
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

              // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
              e.target.value = '';
            };

            return (
              <FormItem>
                <FormLabel>Documentos PDF Adjuntos</FormLabel>
                <div className="space-y-4">
                  {/* Área de carga */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <FormControl>
                          <Input
                            type="file"
                            multiple
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Arrastra o selecciona archivos PDF (máx. 5MB cada uno)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de archivos */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Archivos seleccionados ({files.length})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange([])}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Limpiar todos
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((file: File, index: number) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-3 border-black rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-red-100 p-2 rounded">
                                <FileText className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm truncate max-w-xs">{file.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{(file.size / 1024).toFixed(0)} KB</span>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">PDF</span>
                                </div>
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
                              className="h-8 w-8 p-0 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="flex justify-between items-center gap-x-4">
          <Separator className="flex-1" />
          <p className="text-muted-foreground">SIGEAC</p>
          <Separator className="flex-1" />
        </div>
        <Button disabled={createRequisition.isPending || updateRequisition.isPending}>
          {isEditing ? 'Editar Requisición' : 'Generar Requisición'}
          {(createRequisition.isPending || updateRequisition.isPending) && (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          )}
        </Button>
      </form>
    </Form>
  );
}
