'use client';

import { useCreateDispatchRequest } from '@/actions/mantenimiento/almacen/solicitudes/salida/action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useGetWarehousesEmployees } from '@/hooks/mantenimiento/almacen/empleados/useGetWarehousesEmployees';
import { useGetBatchesWithInWarehouseArticles } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesWithInWarehouseArticles';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetWorkshopsByLocation } from '@/hooks/sistema/empresas/talleres/useGetWorkshopsByLocation';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Consumable, Employee } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const FormSchema = z
  .object({
    requested_by: z.string(),
    request_number: z.string(),
    dispatch_type: z.enum(['aircraft', 'workshop'], {
      message: 'Debe seleccionar si el despacho es para una Aeronave o un Taller.',
    }),
    workshop_id: z.string().optional(),
    delivered_by: z.string(),
    aircraft_id: z.string().optional(),
    submission_date: z.date({ message: 'Debe ingresar la fecha.' }),
    articles: z
      .array(
        z.object({
          article_id: z.coerce.number(),
          serial: z.string().nullable(),
          quantity: z.number().positive('La cantidad debe ser mayor a 0'),
          batch_id: z.number(),
          unit: z.enum(['litros', 'mililitros']).optional(), // solo si batch es L
        }),
      )
      .min(1, 'Debe agregar al menos un artículo'),
    justification: z.string({ message: 'Debe ingresar una justificación de la salida.' }),
    status: z.string(),
  })
  .superRefine((d, ctx) => {
    if (!d.aircraft_id && !d.workshop_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Seleccione una aeronave o un taller.',
        path: ['aircraft_id'],
      });
    }
  });

type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  onClose: () => void;
}

export function ConsumableDispatchForm({ onClose }: FormProps) {
  const { user } = useAuth();
  const { selectedCompany } = useCompanyStore();

  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [requestBy, setRequestedBy] = useState<Employee>();

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
      submission_date: new Date(),
      articles: [{ article_id: 0, serial: null, quantity: 0, batch_id: 0, unit: undefined }],
    },
  });

  const { control, watch, setValue, setError, clearErrors } = form;
  const { fields, append, remove, update } = useFieldArray({ control, name: 'articles' });

  const findBatchById = (batch_id: number): Batch | null =>
    consumableBatches.find((b) => b.batch_id === batch_id) ?? null;

  const findArticleById = (id: number): Consumable | undefined =>
    consumableBatches.flatMap((b) => b.articles).find((a) => a.id === id) as Consumable | undefined;

  function handleArticleSelectAtRow(rowIndex: number, id: number, serial: string | null, batch_id: number) {
    const batch = findBatchById(batch_id);
    if (!batch) return;
    update(rowIndex, {
      article_id: Number(id),
      serial: serial ?? null,
      quantity: 0,
      batch_id: Number(batch_id),
      unit: batch.unit?.value?.toUpperCase() === 'L' ? 'litros' : undefined,
    });
    clearErrors([`articles.${rowIndex}.quantity`, `articles.${rowIndex}.unit`]);
  }

  function validateQuantityAtRow(rowIndex: number, raw: string, article_id: number) {
    // 1. Manejar cadena vacía o espacios en blanco
    const trimmedRaw = raw.trim(); // Opcional: limpiar espacios
    if (trimmedRaw === '') {
      setValue(`articles.${rowIndex}.quantity`, 0, { shouldValidate: true, shouldDirty: true });
      clearErrors(`articles.${rowIndex}.quantity`);
      return; // Detener la ejecución
    }

    const art = findArticleById(article_id);
    const qt = art!.quantity;
    const str = trimmedRaw.replace(',', '.'); // Usar trimmedRaw
    const value = parseFloat(str);

    if (isNaN(value)) {
      setError(`articles.${rowIndex}.quantity`, { type: 'manual', message: 'Formato de número inválido' });
      return;
    }


    if (value <= 0) {
      setError(`articles.${rowIndex}.quantity`, { type: 'manual', message: 'La cantidad debe ser mayor a 0' });
      return;
    }

    clearErrors(`articles.${rowIndex}.quantity`);
    setValue(`articles.${rowIndex}.quantity`, value, { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = async (data: FormSchemaType) => {
    const payload = {
      ...data,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-2 w-full">
        <div className="flex gap-2 items-center">
          <FormField
            control={form.control}
            name="request_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Solicitud</FormLabel>
                <FormControl>
                  <Input className="w-[250px]" placeholder="Ingrese el número de solicitud" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        <div className="flex gap-2">
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
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Seleccione una fecha...</span>
                        )}
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
        </div>

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
        </div>

        {/* Lista de artículos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Artículos</FormLabel>
            <Button
              disabled={isBatchesLoading}
              type="button"
              variant="outline"
              onClick={() => append({ article_id: 0, serial: null, quantity: 0, batch_id: 0, unit: undefined })}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>
          <ScrollArea className={fields.length > 1 ? 'h-[200px] pr-2' : ''}>
            <div className="flex flex-col gap-2">
              {fields.map((field, idx) => {
                const currentBatch = findBatchById(watch(`articles.${idx}.batch_id`));
                const unitType = currentBatch?.unit?.value?.toUpperCase(); // 'U' | 'L' | undefined
                const selectedArticleId = watch(`articles.${idx}.article_id`);
                const selectedArticle = selectedArticleId ? findArticleById(selectedArticleId) : undefined;

                return (
                  <div key={field.id} className="border rounded-lg p-3 flex gap-2">
                    {/* Selector de consumible */}
                    <FormField
                      control={form.control}
                      name={`articles.${idx}.article_id`}
                      render={() => (
                        <FormItem className="flex flex-col w-full mt-2.5">
                          <FormLabel>Consumible #{idx + 1}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                disabled={isBatchesLoading}
                                variant="outline"
                                role="combobox"
                                className="justify-between"
                              >
                                {isBatchesLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" /> Cargando consumibles...
                                  </div>
                                ) : selectedArticle ? (
                                  <div>
                                    <Badge variant="secondary">{currentBatch?.name}</Badge>{' '}
                                    {selectedArticle.part_number} / {selectedArticle.serial ?? 'S/N'}
                                  </div>
                                ) : (
                                  'Selec. el consumible'
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[360px] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar consumible..." />
                                <CommandList>
                                  <CommandEmpty>No se han encontrado consumibles...</CommandEmpty>
                                  {consumableBatches?.map((b) => (
                                    <CommandGroup key={b.batch_id} heading={`${b.name} · ${b.unit?.label ?? ''}`}>
                                      {b.articles.map((a) => (
                                        <CommandItem
                                          value={`${a.part_number}-${a.id}`}
                                          key={a.id}
                                          onSelect={() =>
                                            handleArticleSelectAtRow(idx, a.id!, a.serial ?? null, b.batch_id)
                                          }
                                        >
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">{a.part_number}</span>
                                            <span className="text-xs text-muted-foreground font-bold">
                                              Cant: {a.quantity! ?? '-'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              Serial: {a.serial ?? 'N/A'}
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

                    {/* Cantidad + Unidad por fila + Quitar */}
                    <div className="flex items-end gap-3">
                      <FormField
                        control={form.control}
                        name={`articles.${idx}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Cantidad</FormLabel>
                            <FormControl>
                              <Input
                                value={field.value ?? ''}
                                onChange={(e) => validateQuantityAtRow(idx, e.target.value, selectedArticle!.id)}
                                disabled={!selectedArticle}
                                placeholder={unitType === 'U' ? 'Ej: 1, 2, 3...' : 'Ej: 0.5, 1, 2...'}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {unitType === 'L' && (
                        <FormField
                          control={form.control}
                          name={`articles.${idx}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidad</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="litros" id={`litros-${idx}`} />
                                    <Label htmlFor={`litros-${idx}`}>Litros</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="mililitros" id={`ml-${idx}`} />
                                    <Label htmlFor={`ml-${idx}`}>Mililitros</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <Button type="button" variant="secondary" onClick={() => remove(idx)} className="h-9">
                        <Trash2 className="h-4 w-4 mr-1" /> Quitar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Justificación */}
        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificación</FormLabel>
              <FormControl>
                <Textarea rows={2} className="w-full" placeholder="EJ: Se necesita para la limpieza de..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
