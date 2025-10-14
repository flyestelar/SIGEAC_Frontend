'use client';

import { useCreateDispatchRequest } from '@/actions/mantenimiento/almacen/solicitudes/salida/action';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useGetWarehousesEmployees } from '@/hooks/mantenimiento/almacen/empleados/useGetWarehousesEmployees';
import { useGetBatchesWithInWarehouseArticles } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesWithInWarehouseArticles';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetDepartments } from '@/hooks/sistema/departamento/useGetDepartment';
import { useGetWorkshopsByLocation } from '@/hooks/sistema/empresas/talleres/useGetWorkshopsByLocation';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Consumable, Employee } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const FormSchema = z.object({
  requested_by: z.string(),
  dispatch_type: z.enum(['aircraft', 'workshop'], {
    message: 'Debe seleccionar si el despacho es para una Aeronave o un Taller.',
  }),
  workshop_id: z.string().optional(),
  delivered_by: z.string(),
  aircraft_id: z.string(),
  submission_date: z.date({ message: 'Debe ingresar la fecha.' }),
  articles: z.object({
    article_id: z.coerce.number(),
    serial: z.string().nullable(),
    quantity: z.number(),
    batch_id: z.number(),
  }),
  justification: z.string({ message: 'Debe ingresar una justificación de la salida.' }),
  status: z.string(),
  unit: z.enum(['litros', 'mililitros'], { message: 'Debe seleccionar una unidad.' }).optional(),
});

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  onClose: () => void;
}

export function ConsumableDispatchForm({ onClose }: FormProps) {
  const { user } = useAuth();
  const { selectedCompany } = useCompanyStore();

  const [open, setOpen] = useState(false);
  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [requestBy, setRequestedBy] = useState<Employee>();
  const [quantity, setQuantity] = useState('');
  const [articleSelected, setArticleSelected] = useState<Consumable | undefined>(undefined);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null); // ✅ unidad viene del batch

  const { createDispatchRequest } = useCreateDispatchRequest();
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: workshops, isLoading: isWorkshopsLoading, isError: isWorkshopsError } = useGetWorkshopsByLocation();
  const { data: batches, isPending: isBatchesLoading } = useGetBatchesWithInWarehouseArticles('CONSUMIBLE');
  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useGetEmployeesByDepartment('MANP');

  const {
    data: warehouseEmployees,
    isLoading: warehouseEmployeesLoading,
    isError: warehouseEmployeesError,
  } = useGetWarehousesEmployees();

  // Sólo consumibles
  const consumableBatches = useMemo(
    () => (batches ?? []).filter((b) => b.category === 'CONSUMIBLE' || !b.category),
    [batches],
  );

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      justification: '',
      requested_by: `${user?.employee?.[0]?.dni ?? ''}`,
      dispatch_type: 'aircraft',
      status: 'proceso',
    },
  });

  const { setValue, getValues, watch, clearErrors, setError } = form;
  useEffect(() => {
    const currentQuantity = parseFloat(quantity.replace(',', '.')) || 0;
    const article = getValues('articles');
    setValue('articles', { ...article, quantity: currentQuantity });
  }, [quantity, selectedBatch, getValues, setValue]);
  z;
  const onSubmit = async (data: FormSchemaType) => {
    const payload = {
      ...data,
      articles: [{ ...data.articles }],
      created_by: user!.username,
      submission_date: format(data.submission_date, 'yyyy-MM-dd'),
      category: 'consumible',
      status: 'APROBADO',
      approved_by: user?.employee?.[0]?.dni,
      delivered_by: data.delivered_by,
      user_id: Number(user!.id),
    };

    await createDispatchRequest.mutateAsync({ data: payload, company: selectedCompany!.slug });
    onClose();
  };

  const handleArticleSelect = (id: number, serial: string | null, batch_id: number) => {
    const selectedArticle = consumableBatches.flatMap((batch) => batch.articles).find((a) => a.id === id);
    const batch = consumableBatches.find((b) => b.batch_id === batch_id) || null; // ✅ batch con unidad

    if (!selectedArticle || !batch) return;

    // Set form values
    setValue('articles', {
      article_id: Number(id),
      serial: serial ?? null,
      quantity: 0,
      batch_id: Number(batch_id),
    });

    setArticleSelected(selectedArticle as Consumable);
    setSelectedBatch(batch);

    // Ajusta selector de unidad visible/valor por defecto
    const v = batch.unit?.value?.toUpperCase();
    if (v === 'U') {
      setValue('unit', undefined); // no mostrar RadioGroup
    } else if (v === 'L') {
      setValue('unit', 'litros'); // default
    } else {
      setValue('unit', undefined);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3 w-full">
        {/* Tipo de Despacho */}
        <FormField
          control={form.control}
          name="dispatch_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Despacho</FormLabel>
              <FormControl>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="aircraft"
                      checked={field.value === 'aircraft'}
                      onChange={() => field.onChange('aircraft')}
                    />
                    <span>Aeronave</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="workshop"
                      checked={field.value === 'workshop'}
                      onChange={() => field.onChange('workshop')}
                    />
                    <span>Taller</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Aeronave */}
        {form.watch('dispatch_type') === 'aircraft' && (
          <FormField
            control={form.control}
            name="aircraft_id"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-3 mt-1.5 w-full">
                <FormLabel>Aeronave</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        disabled={isAircraftsLoading || isAircraftsError}
                        variant="outline"
                        role="combobox"
                        className={cn('justify-between', !field.value && 'text-muted-foreground')}
                      >
                        {isAircraftsLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                        {field.value ? (
                          <p>{aircrafts?.find((a) => `${a.id}` === field.value)?.acronym}</p>
                        ) : (
                          'Elige la aeronave...'
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
                          {aircrafts?.map((aircraft) => (
                            <CommandItem
                              value={`${aircraft.acronym} ${aircraft.manufacturer.name}`}
                              key={aircraft.id}
                              onSelect={() => {
                                form.setValue('aircraft_id', aircraft.id.toString(), { shouldValidate: true });
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  `${aircraft.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <p>
                                {aircraft.acronym} - {aircraft.manufacturer.name}
                              </p>
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
        )}

        {/* Taller */}
        {form.watch('dispatch_type') === 'workshop' && (
          <FormField
            control={form.control}
            name="workshop_id"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-3 mt-1.5 w-full">
                <FormLabel>Taller</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        disabled={isWorkshopsLoading || isWorkshopsError}
                        variant="outline"
                        role="combobox"
                        className={cn('justify-between', !field.value && 'text-muted-foreground')}
                      >
                        {isWorkshopsLoading && <Loader2 className="size-4 animate-spin mr-2" />}
                        {field.value ? (
                          <p>{workshops?.find((ws) => `${ws.id}` === field.value)?.name}</p>
                        ) : (
                          'Elige el taller...'
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Busque un taller..." />
                      <CommandList>
                        <CommandEmpty className="text-xs p-2 text-center">
                          No se ha encontrado ningun taller.
                        </CommandEmpty>
                        <CommandGroup>
                          {workshops?.map((workshop) => (
                            <CommandItem
                              value={`${workshop.id}`}
                              key={workshop.id}
                              onSelect={() => {
                                form.setValue('workshop_id', workshop.id.toString(), { shouldValidate: true });
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  `${workshop.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <p>{workshop.name}</p>
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
        )}

        {/* Fecha */}
        <FormField
          control={form.control}
          name="submission_date"
          render={({ field }) => (
            <FormItem className="flex flex-col mt-2.5 w-full col-span-2">
              <FormLabel>Fecha de Solicitud</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                    >
                      {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccione una fecha...</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Entregado / Recibe */}
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="delivered_by"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Entregado por:</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el responsable..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouseEmployeesLoading && <Loader2 className="size-4 animate-spin mx-2 my-1" />}
                    {warehouseEmployeesError && (
                      <div className="px-2 py-1 text-destructive text-sm">Error cargando personal de almacén</div>
                    )}
                    {warehouseEmployees?.map((employee) => (
                      <SelectItem key={employee.dni} value={`${employee.dni}`}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
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
                            const dni = form.getValues('requested_by');
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
                                String(requestBy?.dni ?? form.getValues('requested_by')) === String(e.dni)
                                  ? 'opacity-100'
                                  : 'opacity-0',
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
        </div>

        {/* Consumible / Cantidad / Unidad (desde BATCH) */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="articles"
              render={() => (
                <FormItem className="flex flex-col w-full">
                  <FormLabel>Consumible a Retirar</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
                        {articleSelected ? `${articleSelected.part_number}` : 'Selec. el consumible'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar consumible..." />
                        <CommandList>
                          <CommandEmpty>No se han encontrado consumibles...</CommandEmpty>
                          {consumableBatches?.map((batch) => (
                            <CommandGroup key={batch.batch_id} heading={`${batch.name} · ${batch.unit?.label ?? ''}`}>
                              {batch.articles.map((article) => (
                                <CommandItem
                                  value={`${article.part_number} ${article.serial ?? ''} ${batch.name}`}
                                  key={article.id}
                                  onSelect={() => {
                                    handleArticleSelect(article.id!, article.serial ?? null, batch.batch_id);
                                    setArticleSelected(article as Consumable);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      articleSelected?.id === article.id ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{article.part_number}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Serial: {article.serial ?? 'N/A'}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cantidad */}
            <div className="flex items-center justify-center gap-2 wfull">
              <div className="flex flex-col space-y-2 w-full">
                <Label>Cantidad</Label>
                <Input
                  disabled={!articleSelected}
                  value={quantity}
                  onChange={(e) => {
                    const raw = e.target.value.replace(',', '.');
                    const value = parseFloat(raw);

                    if (Number.isNaN(value) || value <= 0) {
                      setQuantity(e.target.value);
                      setError('articles.quantity', { type: 'manual', message: 'La cantidad debe ser mayor a 0' });
                      return;
                    }

                    const batchUnit = selectedBatch?.unit?.value?.toUpperCase();

                    if (batchUnit === 'U' && !Number.isInteger(value)) {
                      setError('articles.quantity', {
                        type: 'manual',
                        message: 'Para unidades, la cantidad debe ser entera',
                      });
                    } else {
                      clearErrors('articles.quantity');
                    }

                    setQuantity(e.target.value);
                  }}
                  placeholder={
                    selectedBatch?.unit?.value?.toUpperCase() === 'U' ? 'Ej: 1, 2, 3...' : 'Ej: 0.5, 1, 2...'
                  }
                />
              </div>

              {/* Unidad (sólo si el batch es volumétrico L) */}
              {selectedBatch?.unit?.value?.toUpperCase() === 'L' && (
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="litros" id="litros" />
                            <Label htmlFor="litros">Litros</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mililitros" id="mililitros" />
                            <Label htmlFor="mililitros">Mililitros</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Justificación */}
          <FormField
            control={form.control}
            name="justification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justificación</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    className="w-full"
                    placeholder="EJ: Se necesita para la limpieza de..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <Button
          className="bg-primary mt-2 text-white hover:bg-blue-900 disabled:bg-primary/70"
          disabled={createDispatchRequest?.isPending}
          type="submit"
        >
          {createDispatchRequest?.isPending ? <Loader2 className="size-4 animate-spin" /> : <p>Crear</p>}
        </Button>
      </form>
    </Form>
  );
}
