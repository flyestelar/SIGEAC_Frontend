'use client';

import { useCreateFlightControl } from '@/actions/mantenimiento/planificacion/vuelos/actions';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useGetEmployeesByDepartment } from '@/hooks/sistema/useGetEmployeesByDepartament';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Employee } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Clock, Hash, Loader2, Plane, Route, User, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../../ui/button';
import { Calendar } from '../../../ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../ui/popover';

/* ------------------------------- Schema ------------------------------- */

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const formSchema = z
  .object({
    aircraft_id: z.string().min(1, 'Seleccione la aeronave.'),
    flight_number: z.string().min(2, 'Ingrese el número de vuelo.'),
    flight_date: z.date({ required_error: 'Seleccione la fecha del vuelo.' }),

    origin: z.string().min(2, 'Ingrese origen.'),
    destination: z.string().min(2, 'Ingrese destino.'),

    departure_time: z.string().regex(timeRegex, 'Hora inválida (HH:MM).'),
    arrival_time: z.string().regex(timeRegex, 'Hora inválida (HH:MM).'),

    pilot: z.string().min(2, 'Ingrese el capitán.'),
    co_pilot: z.string().min(2, 'Ingrese el primer oficial.'),

    // Se calcula automáticamente
    flight_hours: z.coerce.number().min(0, 'Horas inválidas.'),

    // Si lo quieres mantener
    flight_cycles: z.coerce.number().min(0, 'No puede ser negativo.'),
  })
  .superRefine((vals, ctx) => {
    // Opcional: no permitir mismo origen/destino
    if (vals.origin.trim().toUpperCase() === vals.destination.trim().toUpperCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination'],
        message: 'Destino debe ser distinto al origen.',
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  onClose: () => void;
}

/* ---------------------------- Utils (horas) --------------------------- */

function minutesFromHHMM(hhmm: string) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

// diferencia en horas, soporta cruce de medianoche
function diffHours(departure: string, arrival: string) {
  const d = minutesFromHHMM(departure);
  const a = minutesFromHHMM(arrival);
  const diffMin = a >= d ? a - d : a + 24 * 60 - d;
  // 2 decimales
  return Math.round((diffMin / 60) * 100) / 100;
}

export default function CreateFlightControlForm({ onClose }: FormProps) {
  const { createFlightControl } = useCreateFlightControl();
  const { selectedCompany } = useCompanyStore();
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);
  const {
    data: employees,
    isLoading: isEmployeesLoading,
    isError: isEmployeesError,
  } = useGetEmployeesByDepartment('OPS');
  const [pilot, setPilot] = useState<Employee | null>(null);
  const [coPilot, setCoPilot] = useState<Employee | null>(null);
  const [openPilots, setOpenPilots] = useState(false);
  const [openCoPilots, setOpenCoPilots] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flight_number: '',
      origin: '',
      destination: '',
      pilot: '',
      co_pilot: '',
      departure_time: '08:00',
      arrival_time: '09:00',
      flight_cycles: 1,
    },
  });

  const { control, watch, setValue } = form;

  const departureTime = watch('departure_time');
  const arrivalTime = watch('arrival_time');

  const computedHours = useMemo(() => {
    if (!departureTime || !arrivalTime) return 0;
    if (!timeRegex.test(departureTime) || !timeRegex.test(arrivalTime)) return 0;
    return diffHours(departureTime, arrivalTime);
  }, [departureTime, arrivalTime]);

  // set automático del campo flight_hours (lo manda al submit)
  useEffect(() => {
    setValue('flight_hours', computedHours, { shouldDirty: true, shouldValidate: true });
  }, [computedHours, setValue]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedCompany?.slug) return;

    // Normalización rápida (códigos aeropuerto)
    const data = {
      ...values,
      flight_date: format(values.flight_date, 'yyyy-MM-dd'),
      origin: values.origin.trim().toUpperCase(),
      destination: values.destination.trim().toUpperCase(),
      pilot: values.pilot.trim(),
      co_pilot: values.co_pilot.trim(),
      flight_number: values.flight_number.trim().toUpperCase(),
      flight_hours: computedHours,
    };

    await createFlightControl.mutateAsync({ data: data, company: selectedCompany.slug });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Bloque 1: Aeronave + Número + Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Aeronave (mantiene el tuyo) */}
          <FormField
            control={form.control}
            name="aircraft_id"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2 mt-2">
                <FormLabel className="inline-flex items-center gap-2">
                  <Plane className="h-4 w-4 opacity-80" />
                  Aeronave
                </FormLabel>

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
                      <CommandInput placeholder="Buscar aeronave..." />
                      <CommandList>
                        <CommandEmpty className="text-sm p-2 text-center">Sin resultados.</CommandEmpty>
                        <CommandGroup>
                          {aircrafts?.map((aircraft) => (
                            <CommandItem
                              value={`${aircraft.id}`}
                              key={aircraft.id}
                              onSelect={() =>
                                form.setValue('aircraft_id', aircraft.id.toString(), { shouldValidate: true })
                              }
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  `${aircraft.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <p className="font-medium">{aircraft.acronym}</p>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <FormDescription className="text-xs">Aeronave que realizó el vuelo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número de vuelo */}
          <FormField
            control={control}
            name="flight_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Hash className="h-4 w-4 opacity-80" />
                  Nro. de vuelo
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej: PZOCS199" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Identificador del vuelo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha */}
          <FormField
            control={form.control}
            name="flight_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel className="inline-flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 opacity-80" />
                  Fecha de vuelo
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Seleccione...</span>}
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
                      disabled={(date: Date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs">Día en que se realizó el vuelo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bloque 2: Ruta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Route className="h-4 w-4 opacity-80" />
                  Desde
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej: PZO" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Aeropuerto de salida.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Route className="h-4 w-4 opacity-80" />
                  Hasta
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ej: CCS" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Aeropuerto de llegada.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bloque 3: Tripulación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pilot"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5 w-full">
                <FormLabel className="inline-flex items-center gap-2">
                  <User className="h-4 w-4 opacity-80" />
                  Capitán
                </FormLabel>
                <Popover open={openPilots} onOpenChange={setOpenPilots}>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={isEmployeesLoading || isEmployeesError}
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPilots}
                      className="justify-between"
                    >
                      {pilot
                        ? `${pilot.first_name} ${pilot.last_name}`
                        : (() => {
                            const dni = field.value;
                            const found = employees?.find((e) => String(e.dni) === String(dni));
                            return found ? `${found.first_name} ${found.last_name}` : 'Selec. al capitán';
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
                              setPilot(e);
                              form.setValue('pilot', String(e.dni), { shouldValidate: true, shouldDirty: true });
                              setOpenPilots(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                String(pilot?.dni ?? field.value) === String(e.dni) ? 'opacity-100' : 'opacity-0',
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
            name="co_pilot"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5 w-full">
                <FormLabel className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 opacity-80" />
                  Primer oficial
                </FormLabel>
                <Popover open={openCoPilots} onOpenChange={setOpenCoPilots}>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={isEmployeesLoading || isEmployeesError}
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCoPilots}
                      className="justify-between"
                    >
                      {coPilot
                        ? `${coPilot.first_name} ${coPilot.last_name}`
                        : (() => {
                            const dni = field.value;
                            const found = employees?.find((e) => String(e.dni) === String(dni));
                            return found ? `${found.first_name} ${found.last_name}` : 'Selec. al primer oficial';
                          })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Selec. el co-piloto..." />
                      <CommandList>
                        <CommandEmpty>No se han encontrado pilotos...</CommandEmpty>
                        {employees
                          ?.filter((e) => e.id != pilot?.id)
                          .map((e) => (
                            <CommandItem
                              value={`${e.first_name} ${e.last_name} ${e.dni}`}
                              key={e.id}
                              onSelect={() => {
                                setCoPilot(e);
                                form.setValue('co_pilot', String(e.dni), { shouldValidate: true, shouldDirty: true });
                                setOpenCoPilots(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  String(coPilot?.dni ?? field.value) === String(e.dni) ? 'opacity-100' : 'opacity-0',
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

        {/* Bloque 4: Tiempos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="departure_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 opacity-80" />
                  Hora salida
                </FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="arrival_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 opacity-80" />
                  Hora llegada
                </FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Horas calculadas */}
          <FormField
            control={control}
            name="flight_hours"
            render={() => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 opacity-80" />
                  Horas de vuelo
                </FormLabel>
                <FormControl>
                  <Input value={computedHours.toString()} readOnly className="bg-muted" />
                </FormControl>
                <FormDescription className="text-xs">
                  Calculado automáticamente (soporta cruce de medianoche).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Opcional: ciclos */}
          <FormField
            control={control}
            name="flight_cycles"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 opacity-80" />
                  Ciclos
                </FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={1} placeholder="Ej: 1" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Si aplica para tu registro.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          className="bg-primary mt-2 text-white hover:bg-blue-900 disabled:bg-primary/70"
          disabled={createFlightControl?.isPending}
          type="submit"
        >
          {createFlightControl?.isPending ? <Loader2 className="size-4 animate-spin" /> : <span>Crear vuelo</span>}
        </Button>
      </form>
    </Form>
  );
}
