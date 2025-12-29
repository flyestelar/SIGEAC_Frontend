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
import { Check, ChevronsUpDown, FileText, Loader2, MinusCircle, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const FormSchema = z.object({
  justification: z
    .string({ message: 'La justificación debe ser válida.' })
    .min(2, { message: 'La justificación debe ser válida.' }),
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
    },
  });
  console.log('ZOD ERRORS:', form.formState.errors);
  console.log('Valores actuales del formulario:', form.watch());
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
        <div className="flex gap-2 items-center justify-center">
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
            name="work_order"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Nº de Orden de Trabajo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 281025-B1-01" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="articles"
          render={({ field }: { field: any }) => (
            <FormItem className="flex flex-col">
              <div className="flex gap-4 items-end">
                <FormItem className="flex flex-col w-[200px]">
                  <FormLabel>Artículos</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          disabled={isBatchesLoading}
                          role="combobox"
                          className={cn('justify-between', selectedBatches.length === 0 && 'text-muted-foreground')}
                        >
                          {selectedBatches.length > 0
                            ? `${selectedBatches.length} reng. seleccionados`
                            : 'Selec. un renglón...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar..." />
                        <CommandList>
                          <CommandEmpty>No existen renglones...</CommandEmpty>
                          <CommandGroup>
                            <div className="flex justify-center m-2">
                              <CreateBatchDialog />
                            </div>
                            {data &&
                              data.map((batch) => (
                                <CommandItem
                                  key={batch.name}
                                  value={batch.name}
                                  onSelect={() => handleBatchSelect(batch.name, batch.id.toString(), batch.category)}
                                >
                                  <Check
                                    className={cn(
                                      '',
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
                </FormItem>

                <FormField
                  control={form.control}
                  name="aircraft_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-[200px]">
                      <FormLabel>Aeronave</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              disabled={isAircraftsLoading}
                              variant="outline"
                              role="combobox"
                              className={cn('justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {isAircraftsLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                              {field.value
                                ? aircrafts?.find((aircraft) => aircraft.id.toString() === field.value)?.acronym
                                : 'Selec. la aeronave...'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Busque una aeronave..." />
                            <CommandList>
                              <CommandEmpty className="text-sm p-2 text-center">
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
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4 space-y-4">
                <ScrollArea className={cn('', selectedBatches.length > 2 ? 'h-[300px]' : '')}>
                  {selectedBatches.map((batch) => (
                    <div key={batch.batch}>
                      <div className="flex items-center">
                        <h4 className="font-semibold">{batch.batch_name}</h4>
                        <Button variant="ghost" type="button" size="icon" onClick={() => removeBatch(batch.batch)}>
                          <MinusCircle className="size-4" />
                        </Button>
                      </div>
                      <ScrollArea className={cn('', batch.batch_articles.length > 2 ? 'h-[150px]' : '')}>
                        {batch.batch_articles.map((article, index) => (
                          <div key={index} className="flex items-center space-x-4 mt-2">
                            <Input
                              placeholder="Número de parte"
                              onChange={(e) => handleArticleChange(batch.batch, index, 'part_number', e.target.value)}
                            />

                            <Input
                              placeholder="N/P Alterno"
                              onChange={(e) =>
                                handleArticleChange(batch.batch, index, 'alt_part_number', e.target.value)
                              }
                            />
                            <Select
                              disabled={secondaryUnitLoading}
                              onValueChange={(value) => handleArticleChange(batch.batch, index, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Unidad Sec." />
                              </SelectTrigger>
                              <SelectContent>
                                {secondaryUnits &&
                                  secondaryUnits.map((secU) => (
                                    <SelectItem key={secU.id} value={secU.id.toString()}>
                                      {secU.secondary_unit}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.articles?.[index]?.batch_articles?.[index]?.unit && (
                              <p className="text-red-500 text-xs">La unidad es obligatoria para consumibles.</p>
                            )}
                            <Input
                              type="number"
                              placeholder="Cantidad"
                              onChange={(e) =>
                                handleArticleChange(batch.batch, index, 'quantity', Number(e.target.value))
                              }
                            />
                            <Input
                              type="file"
                              accept="image/*"
                              className="cursor-pointer"
                              onChange={(e) => handleArticleChange(batch.batch, index, 'image', e.target.files?.[0])}
                            />
                            <Button
                              variant="ghost"
                              type="button"
                              size="icon"
                              onClick={() => removeArticleFromBatch(batch.batch, index)}
                              className="hover:text-red-500"
                            >
                              <MinusCircle className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </ScrollArea>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => addArticle(batch.batch)}
                        className="mt-2 text-sm"
                      >
                        Agregar artículo
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
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
