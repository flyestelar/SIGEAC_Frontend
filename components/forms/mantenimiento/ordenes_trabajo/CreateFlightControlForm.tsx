'use client';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plane, User, Clock } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCreateFlightControl, useUpdateFlightControl } from '@/actions/planificacion/vuelos/actions';
import { useCompanyStore } from '@/stores/CompanyStore';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';

function formatFlightDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

function getFlightDurationPreview(departureTime: string | undefined, arrivalTime: string | undefined) {
  if (!departureTime || !arrivalTime) return null;

  const [startHour, startMinute] = departureTime.split(':').map(Number);
  const [endHour, endMinute] = arrivalTime.split(':').map(Number);

  if ([startHour, startMinute, endHour, endMinute].some((value) => Number.isNaN(value))) {
    return null;
  }

  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end < start) {
    end += 24 * 60;
  }
  const duration = end - start;
  if (duration < 0) return null;

  return formatFlightDuration(duration);
}

const formSchema = z.object({
  aircraft_id: z.string().min(1, 'Selecciona una aeronave'),
  flight_number: z.string().optional(),
  flight_date: z.date({ required_error: 'Selecciona la fecha del vuelo' }),
  origin: z.string().min(1, 'Campo requerido'),
  destination: z.string().min(1, 'Campo requerido'),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  aircraft_operator: z.string().min(1, 'Campo requerido'),
  flight_hours: z.coerce.number().min(0, 'Debe ser ≥ 0'),
  flight_cycles: z.coerce.number().int().min(0, 'Debe ser ≥ 0'),
});

type FormValues = z.infer<typeof formSchema>;

interface FlightData {
  id: string;
  flight_number?: string;
  aircraft_operator: string;
  origin: string;
  destination: string;
  flight_date: string | Date;
  departure_time?: string;
  arrival_time?: string;
  flight_hours: number;
  flight_cycles: number | string;
  aircraft_id: string;
}

interface FormProps {
  onClose: () => void;
  flightData?: FlightData;
  defaultAircraftId?: string;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b bg-muted/10 px-4 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export default function CreateFlightControlForm({ onClose, defaultAircraftId, flightData }: FormProps) {
  const { createFlightControl } = useCreateFlightControl();
  const { updateFlightControl } = useUpdateFlightControl();
  const { selectedCompany } = useCompanyStore();
  const {
    data: aircrafts,
    isLoading: isAircraftsLoading,
    isError: isAircraftsError,
  } = useGetMaintenanceAircrafts(selectedCompany?.slug);

  const isEditMode = !!flightData;
  const isPending = createFlightControl.isPending || updateFlightControl.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: flightData
      ? {
          aircraft_id: flightData.aircraft_id.toString(),
          flight_number: flightData.flight_number ?? '',
          origin: flightData.origin,
          destination: flightData.destination,
          departure_time: flightData.departure_time ?? '',
          arrival_time: flightData.arrival_time ?? '',
          aircraft_operator: flightData.aircraft_operator,
          flight_hours: Number(flightData.flight_hours),
          flight_cycles: Number(flightData.flight_cycles),
          flight_date:
            typeof flightData.flight_date === 'string' ? new Date(flightData.flight_date) : flightData.flight_date,
        }
      : {
          aircraft_id: defaultAircraftId ?? '',
          flight_number: '',
          origin: '',
          destination: '',
          departure_time: '',
          arrival_time: '',
          aircraft_operator: '',
          flight_hours: 0,
          flight_cycles: 0,
        },
  });

  const departureTime = useWatch({ control: form.control, name: 'departure_time' });
  const arrivalTime = useWatch({ control: form.control, name: 'arrival_time' });

  const flightDurationPreview = getFlightDurationPreview(departureTime, arrivalTime);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      flight_date: format(values.flight_date, 'yyyy-MM-dd'),
    };
    try {
      if (isEditMode) {
        await updateFlightControl.mutateAsync({
          id: flightData.id,
          data: payload,
          company: selectedCompany!.slug,
        });
      } else {
        await createFlightControl.mutateAsync({
          data: payload,
          company: selectedCompany!.slug,
        });
      }
      onClose();
    } catch {
      // error handled by mutation onError
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ── IDENTIFICACIÓN ─────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-card">
          <SectionHeader label="Identificación de Vuelo" />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="aircraft_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Aeronave
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={isAircraftsLoading || isAircraftsError || isEditMode}
                          variant="outline"
                          role="combobox"
                          className={cn('w-full justify-between font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {isAircraftsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : field.value ? (
                            <span className="font-mono text-sm tracking-wider">
                              {aircrafts?.find((a) => `${a.id}` === field.value)?.acronym}
                            </span>
                          ) : (
                            <span className="text-sm">Seleccionar…</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 shadow-md">
                      <Command>
                        <CommandInput placeholder="Buscar aeronave…" />
                        <CommandList>
                          <CommandEmpty className="p-3 text-center text-sm text-muted-foreground">
                            Sin resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {aircrafts?.map((aircraft) => (
                              <CommandItem
                                key={aircraft.id}
                                value={`${aircraft.id}`}
                                onSelect={() => form.setValue('aircraft_id', aircraft.id.toString())}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    `${aircraft.id}` === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <span className="font-mono">{aircraft.acronym}</span>
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

            <FormField
              control={form.control}
              name="flight_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Nro. Vuelo <span className="font-normal normal-case tracking-normal opacity-70">(Opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ETR199"
                      className="font-mono uppercase tracking-wider"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flight_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Fecha de Vuelo
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? (
                            <span className="text-sm">{format(field.value, 'dd MMM yyyy', { locale: es })}</span>
                          ) : (
                            <span className="text-sm">Seleccionar…</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-md" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── ITINERARIO ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-card">
          <SectionHeader label="Itinerario" />
          <div className="p-4">
            <div className="flex items-stretch gap-4 flex-col sm:flex-row">
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem className="shrink-0 grow w-24">
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Origen
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PZO"
                          maxLength={4}
                          className="font-mono text-center text-sm font-semibold uppercase tracking-widest"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="self-end flex h-10 items-center justify-center px-1 text-muted-foreground/40">
                  <div className="h-px w-3 bg-muted-foreground/30" />
                  <Plane className="h-3 w-3 -rotate-45 mx-px" />
                  <div className="h-px w-3 bg-muted-foreground/30" />
                </div>

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem className="shrink-0 grow w-24">
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Destino
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CCS"
                          maxLength={4}
                          className="font-mono text-center text-sm font-semibold uppercase tracking-widest"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 sm:grow">
                <FormField
                  control={form.control}
                  name="departure_time"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Clock className="inline mr-1.5 h-3 w-3" />
                        Salida
                      </FormLabel>
                      <FormControl>
                        <Input type="time" className="font-mono text-sm tabular-nums" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival_time"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Clock className="inline mr-1.5 h-3 w-3" />
                        Llegada
                      </FormLabel>
                      <FormControl>
                        <Input type="time" className="font-mono text-sm tabular-nums" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {flightDurationPreview ? (
                <div className="flex items-end justify-end whitespace-nowrap">
                  <div className="rounded-2xl border border-muted/50 bg-muted/10 px-3 py-2 text-sm text-foreground shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Duración</p>
                    <p className="mt-1 font-mono text-base font-semibold">{flightDurationPreview}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── TRIPULACIÓN Y MÉTRICAS ─────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-card">
          <SectionHeader label="Tripulación y Métricas" />
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="aircraft_operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <User className="inline mr-1.5 h-3 w-3" />
                    Piloto / Operador
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre Completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flight_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Horas de Vuelo
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        className="font-mono pr-8 tabular-nums"
                        {...field}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        H
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flight_cycles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Ciclos
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        className="font-mono pr-10 tabular-nums"
                        {...field}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        CYC
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {onClose && (
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button disabled={isPending} type="submit" className="min-w-[140px]">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Actualizar Registro' : 'Completar Registro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
