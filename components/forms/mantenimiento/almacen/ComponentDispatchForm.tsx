'use client';

import { useCreateDispatchRequest } from '@/actions/mantenimiento/almacen/solicitudes/salida/action';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useGetWarehousesEmployees } from '@/hooks/mantenimiento/almacen/empleados/useGetWarehousesEmployees';
import { useGetBatchesWithInWarehouseArticles } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesWithInWarehouseArticles';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetWorkshopsByLocation } from '@/hooks/sistema/empresas/talleres/useGetWorkshopsByLocation';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Employee } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Calendar } from '../../../ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';
import { Textarea } from '../../../ui/textarea';

const FormSchema = z
  .object({
    dispatch_type: z.enum(['aircraft', 'workshop'], {
      message: 'Debe seleccionar si el despacho es para una Aeronave o un Taller.',
    }),
    request_number: z.string(),
    requested_by: z.string().min(1, 'Debe seleccionar el técnico responsable.'),
    delivered_by: z.string().min(1, 'Debe seleccionar el responsable de almacén.'),
    aircraft_id: z.string().optional(),
    workshop_id: z.string().optional(),
    submission_date: z.date({ message: 'Debe ingresar la fecha.' }),
    articles: z
      .array(
        z.object({
          article_id: z.coerce.number(),
          serial: z.string().nullable(),
          quantity: z.number().int().positive(),
          batch: z.string(),
          batch_id: z.number(),
        }),
      )
      .min(1, 'Debe seleccionar al menos un componente.'),
    justification: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.dispatch_type === 'aircraft' && !!data.aircraft_id) ||
      (data.dispatch_type === 'workshop' && !!data.workshop_id),
    {
      message: 'Debe seleccionar una Aeronave o un Taller según corresponda.',
      path: ['dispatch_type'],
    },
  );

type FormSchemaType = z.infer<typeof FormSchema>;

interface PickedComponent {
  id: number;
  serial: string | null;
  part_number: string;
  batch_id: number;
  batch: string;
  is_serialized: boolean;
  quantity: number;
}

interface FormProps {
  onClose: () => void;
}

export function ComponentDispatchForm({ onClose }: FormProps) {
  const { user } = useAuth();
  const { selectedCompany } = useCompanyStore();
  const { createDispatchRequest } = useCreateDispatchRequest();

  // UI states
  const [openComponents, setOpenComponents] = useState(false);
  const [openRequestedBy, setOpenRequestedBy] = useState(false);
  const [requestBy, setRequestedBy] = useState<Employee>();
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');

  // Remote data
  const {
    data: batches,
    isLoading: isBatchesLoading,
    isError: isBatchesError,
  } = useGetBatchesWithInWarehouseArticles('COMPONENTE');
  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useGetEmployeesByDepartment('MANP');
  const {
    data: warehouseEmployees,
    isLoading: warehouseEmployeesLoading,
    isError: warehouseEmployeesError,
  } = useGetWarehousesEmployees();
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const { data: workshops, isLoading: isWorkshopsLoading, isError: isWorkshopsError } = useGetWorkshopsByLocation();

  // Filtrar SOLO componentes (si tu API categoriza)
  const componentBatches = useMemo(() => {
    return (batches ?? []).filter((b) => b.category === 'COMPONENTE' || !b.category);
  }, [batches]);

  // RHF
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      articles: [],
      justification: '',
      requested_by: user?.employee?.[0]?.dni ? String(user.employee[0].dni) : '',
    },
  });

  // Selección múltiple
  const [selectedComponents, setSelectedComponents] = useState<PickedComponent[]>([]);

  // Sync UI → form
  useEffect(() => {
    form.setValue(
      'articles',
      selectedComponents.map((c) => ({
        article_id: c.id,
        serial: c.serial,
        quantity: c.is_serialized ? 1 : c.quantity,
        batch_id: c.batch_id,
        batch: c.batch,
      })),
      { shouldValidate: true },
    );
  }, [selectedComponents]);

  // Resolver nombre del técnico si hay DNI por defecto
  useEffect(() => {
    if (!requestBy && employees && form.getValues('requested_by')) {
      const found = employees.find((e) => String(e.dni) === form.getValues('requested_by'));
      if (found) setRequestedBy(found);
    }
  }, [employees]);

  const addOrRemoveComponent = (item: {
    id: number;
    serial: string | null;
    part_number: string;
    batch_id: number;
    batch: string;
  }) => {
    setSelectedComponents((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) {
        return prev.filter((c) => c.id !== item.id);
      }
      const is_serialized = !!item.serial;
      return [
        ...prev,
        {
          id: item.id,
          serial: item.serial,
          part_number: item.part_number,
          batch_id: item.batch_id,
          batch: item.batch,
          is_serialized,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: number, qty: number) => {
    setSelectedComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, Math.floor(qty || 1)) } : c)),
    );
  };

  const removeComponent = (id: number) => {
    setSelectedComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const onSubmit = async (data: FormSchemaType) => {
    const formattedData = {
      ...data,
      created_by: `${user?.first_name} ${user?.last_name}`,
      submission_date: format(data.submission_date, 'yyyy-MM-dd'),
      status: 'APROBADO',
      category: 'componente',
      approved_by: user?.employee?.[0]?.dni,
      delivered_by: data.delivered_by,
      user_id: Number(user!.id),
    };
    await createDispatchRequest.mutateAsync({
      data: formattedData,
      company: selectedCompany!.slug,
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3 w-full">
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
                                setSelectedAircraft(aircraft.manufacturer.id.toString());
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

        {/* Componentes: selector (Command) + lista de seleccionados */}
        <FormItem className="flex flex-col mt-2.5 w-full">
          <FormLabel>Componentes a Retirar</FormLabel>

          {/* Selector */}
          <Popover open={openComponents} onOpenChange={setOpenComponents}>
            <PopoverTrigger asChild>
              <Button
                disabled={isBatchesLoading || isBatchesError}
                variant="outline"
                role="combobox"
                aria-expanded={openComponents}
                className="justify-between"
              >
                {selectedComponents.length > 0
                  ? `${selectedComponents.length} componente(s) seleccionado(s)`
                  : 'Selec. los componentes'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0">
              <Command>
                <CommandInput placeholder="Buscar componente..." />
                <CommandList>
                  <CommandEmpty>No se han encontrado componentes...</CommandEmpty>
                  {componentBatches.map((batch) => (
                    <CommandGroup key={batch.batch_id} heading={batch.name}>
                      {batch.articles.map((article) => {
                        const picked = selectedComponents.find((c) => c.id === article.id);
                        return (
                          <CommandItem
                            value={`${batch.name} ${article.part_number} ${article.serial ?? ''} ${article.id}`}
                            key={article.id}
                            onSelect={() => {
                              addOrRemoveComponent({
                                id: article.id!,
                                serial: article.serial ?? null,
                                part_number: article.part_number,
                                batch_id: batch.batch_id,
                                batch: batch.name,
                              });
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', picked ? 'opacity-100' : 'opacity-0')} />
                            <span className="truncate">{article.serial ?? article.part_number}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Lista de seleccionados */}
          <div className="mt-3 rounded-lg border p-3">
            {selectedComponents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay componentes seleccionados.</p>
            ) : (
              <ScrollArea className={selectedComponents.length > 2 ? 'h-32' : ''}>
                <div className="space-y-2 overflow-auto">
                  {selectedComponents.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-md border p-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{c.batch}</Badge>
                          <span className="font-medium truncate">
                            {c.part_number} / {c.serial ?? 'S/N'}
                          </span>
                        </div>
                      </div>

                      {/* Cantidad */}
                      {c.is_serialized ? (
                        <Badge>1</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Cant.</span>
                          <Input
                            type="number"
                            className="w-20"
                            min={1}
                            value={c.quantity}
                            onChange={(e) => updateQuantity(c.id, Number(e.target.value))}
                          />
                        </div>
                      )}

                      {/* Quitar */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeComponent(c.id)}
                        title="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </FormItem>

        {/* Entregado por / Responsable */}
        <div className="flex gap-2">
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

        {/* Fecha */}
        <FormField
          control={form.control}
          name="submission_date"
          render={({ field }) => (
            <FormItem className="flex flex-col mt-2.5 w-full">
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

        {/* Justificación */}
        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificación</FormLabel>
              <FormControl>
                <Textarea rows={2} className="w-full" placeholder="EJ: Se necesita para..." {...field} />
              </FormControl>
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
