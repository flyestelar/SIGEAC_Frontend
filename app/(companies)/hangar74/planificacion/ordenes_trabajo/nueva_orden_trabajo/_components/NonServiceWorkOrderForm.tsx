'use client';
import { useCreateWorkOrder } from '@/actions/planificacion/ordenes_trabajo/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema simplificado sin IDs para las tareas
const manualWorkOrderSchema = z.object({
  description: z.string().min(1, 'La descripción es obligatoria'),
  elaborated_by: z.string().min(1, 'Elaborado por es obligatorio'),
  approved_by: z.string().min(1, 'Aprobado por es obligatorio'),
  reviewed_by: z.string().min(1, 'Revisado por es obligatorio'),
  location_id: z.string().min(1, 'La ubicación es obligatoria'),
  aircraft_id: z.string(),
  date: z.date(),
  work_order_task: z.array(z.object({
    description: z.string().min(1, 'La descripción de la tarea es obligatoria'),
    ata: z.string().min(1, 'Código ATA requerido')
  })).min(1, 'Debe agregar al menos una tarea'),
});

type ManualWorkOrderFormValues = z.infer<typeof manualWorkOrderSchema>;

interface TaskInProgress {
  description: string;
  ata: string;
}

const NonServiceWorkOrderForm = () => {
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskInProgress[]>([]);
  const { selectedStation } = useCompanyStore();
  const { createWorkOrder } = useCreateWorkOrder()
  const { data: aircrafts, isLoading: isAircraftsLoading, isError: isAircraftsError } = useGetMaintenanceAircrafts();
  const router = useRouter();

  const form = useForm<ManualWorkOrderFormValues>({git 
    resolver: zodResolver(manualWorkOrderSchema),
    defaultValues: {
      elaborated_by: 'Ing. Francisco Montilla',
      reviewed_by: 'José Flores',
      approved_by: "Fátima Dos Ramos",
      description: '',
      aircraft_id: '',
      work_order_task: [],
    },
  });

  useEffect(() => {
    if (selectedStation) {
      form.setValue('location_id', selectedStation);
    }
  }, [selectedStation, form]);

  const addEmptyTask = () => {
    setTasks(prev => [...prev, {
      description: '',
      ata: ''
    }]);
  };

  const updateTask = (index: number, field: keyof TaskInProgress, value: string) => {
    setTasks(prev => prev.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (index: number) => {
    setTasks(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    form.setValue("work_order_task", tasks);
  }, [tasks, form]);

  const onSubmit = async (data: ManualWorkOrderFormValues) => {
    const formattedData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd")
    };
    await createWorkOrder.mutateAsync(formattedData);
    form.reset();
    router.push('/hangar74/planificacion/ordenes_trabajo');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <h1 className="text-2xl font-bold">Crear Orden de Trabajo</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className='flex gap-6 items-center justify-center w-full'>
            <div className='w-full grid grid-cols-1 md:grid-cols-2 gap-2'>
              <FormField
                control={form.control}
                name="aircraft_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-3 mt-1.5">
                    <FormLabel>Aeronave</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={isAircraftsLoading || isAircraftsError}
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {
                              isAircraftsLoading && <Loader2 className="size-4 animate-spin mr-2" />
                            }
                            {field.value
                              ? <p>{aircrafts?.find(
                                (aircraft) => `${aircraft.id.toString()}` === field.value
                              )?.acronym}</p>
                              : "Elige la aeronave..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Busque una aeronave..." />
                          <CommandList>
                            <CommandEmpty className="text-xs p-2 text-center">No se ha encontrado ninguna aeronave.</CommandEmpty>
                            <CommandGroup>
                              {aircrafts?.map((aircraft) => (
                                <CommandItem
                                  value={`${aircraft.id}`}
                                  key={aircraft.id}
                                  onSelect={() => {
                                    form.setValue("aircraft_id", aircraft.id.toString());
                                    setSelectedAircraft(aircraft.manufacturer.id.toString());
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      `${aircraft.id.toString()}` === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {
                                    <p>{aircraft.acronym} - {aircraft.manufacturer.name}</p>
                                  }
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">
                      Aeronave que recibirá el servicio.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-3 mt-1.5">
                    <FormLabel>Fecha de Orden</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccione una fecha...</span>
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
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Fecha de la orden de trabajo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className='w-full col-span-2'>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} placeholder="Describa la orden de trabajo..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='w-full grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name="elaborated_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elaborado Por:</FormLabel>
                    <FormControl>
                      <Input {...field} disabled defaultValue={"Ing. Francisco Montilla"} className='disabled:opacity-65' />
                    </FormControl>
                    <FormDescription>
                      Quien elabora la orden de trabajo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reviewed_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revisado Por:</FormLabel>
                    <FormControl>
                      <Input {...field} disabled defaultValue={"José Flores"} className='disabled:opacity-65' />
                    </FormControl>
                    <FormDescription>
                      Quien revisa la orden de trabajo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex flex-col gap-2 mt-2.5 col-span-2'>
                <Label>Dependencia Responsable:</Label>
                <Input disabled defaultValue={"Dir. de Mantenimiento y Planificación"} className='disabled:opacity-65' />
                <p className='text-xs text-muted-foreground'>
                  Quien revisa la orden de trabajo.
                </p>
              </div>
            </div>
          </div>
          {/* Selección de tareas */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-center">Tareas Manuales</h2>

            <div className="flex flex-col gap-4">
              <Button
                disabled={!selectedAircraft}
                type="button"
                onClick={addEmptyTask}
                variant="outline"
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Agregar Tarea
              </Button>

              <ScrollArea className={cn("flex", tasks.length > 2 ? "h-[450px]" : "")}>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {tasks.map((task, index) => (
                    <div key={index} className="p-4 border rounded-lg mb-2">
                      <div className="flex gap-2 justify-between items-center">
                        <FormItem className='w-[120px]'>
                          <FormLabel>Código ATA</FormLabel>
                          <Input
                            value={task.ata}
                            onChange={(e) =>
                              updateTask(index, "ata", e.target.value)
                            }
                            placeholder="Ej: 25"
                          />
                          <FormMessage />
                        </FormItem>
                        <FormItem className="w-full">
                          <FormLabel>Descripción de la Tarea</FormLabel>
                          <Input
                            value={task.description}
                            onChange={(e) =>
                              updateTask(index, "description", e.target.value)
                            }
                            placeholder="Describa la tarea..."
                          />
                          <FormMessage />
                        </FormItem>
                        <Button
                          variant="ghost"
                          type="button"
                          size="icon"
                          onClick={() => removeTask(index)}
                          className="hover:text-red-500 ml-2"
                        >
                          <MinusCircle className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>


          {/* Botones de acción */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={createWorkOrder.isPending} type="submit">{createWorkOrder.isPending ? <Loader2 className='animate-spin size-4' /> : "Crear Orden de Trabajo"}</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default NonServiceWorkOrderForm
