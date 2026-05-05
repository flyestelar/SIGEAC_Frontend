"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  Plane,
  User,
  Clock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  useCreateFlightControl,
  useUpdateFlightControl,
} from "@/actions/planificacion/vuelos/actions";
import { useCompanyStore } from "@/stores/CompanyStore";
import { useGetMaintenanceAircrafts } from "@/hooks/planificacion/useGetMaintenanceAircrafts";

const formSchema = z.object({
  aircraft_id: z.string().min(1, "Selecciona una aeronave"),
  flight_number: z.string().optional(),
  flight_date: z.date({ required_error: "Selecciona la fecha del vuelo" }),
  origin: z.string().min(1, "Campo requerido"),
  destination: z.string().min(1, "Campo requerido"),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  aircraft_operator: z.string().min(1, "Campo requerido"),
  flight_hours: z.coerce.number().min(0, "Debe ser ≥ 0"),
  flight_cycles: z.coerce.number().int().min(0, "Debe ser ≥ 0"),
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
    <div className="border-b bg-muted/20 px-4 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function CreateFlightControlForm({
  onClose,
  defaultAircraftId,
  flightData,
}: FormProps) {
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
          flight_number: flightData.flight_number ?? "",
          origin: flightData.origin,
          destination: flightData.destination,
          departure_time: flightData.departure_time ?? "",
          arrival_time: flightData.arrival_time ?? "",
          aircraft_operator: flightData.aircraft_operator,
          flight_hours: Number(flightData.flight_hours),
          flight_cycles: Number(flightData.flight_cycles),
          flight_date:
            typeof flightData.flight_date === "string"
              ? new Date(flightData.flight_date)
              : flightData.flight_date,
        }
      : {
          aircraft_id: defaultAircraftId ?? "",
          flight_number: "",
          origin: "",
          destination: "",
          departure_time: "",
          arrival_time: "",
          aircraft_operator: "",
          flight_hours: 0,
          flight_cycles: 0,
        },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      flight_date: format(values.flight_date, "yyyy-MM-dd"),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

        {/* ── IDENTIFICACIÓN ─────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader label="Identificación" />
          <div className="grid grid-cols-3 gap-4 p-4">

            <FormField
              control={form.control}
              name="aircraft_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Aeronave</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={isAircraftsLoading || isAircraftsError || isEditMode}
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {isAircraftsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : field.value ? (
                            <span className="font-mono text-sm font-semibold tracking-wider">
                              {aircrafts?.find((a) => `${a.id}` === field.value)?.acronym}
                            </span>
                          ) : (
                            <span className="text-sm">Seleccionar…</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
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
                                onSelect={() =>
                                  form.setValue("aircraft_id", aircraft.id.toString())
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    `${aircraft.id}` === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
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
                  <FormLabel>
                    Nro. Vuelo{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">(Opcional)</span>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Vuelo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            <span className="text-sm">
                              {format(field.value, "d MMM yyyy", { locale: es })}
                            </span>
                          ) : (
                            <span className="text-sm">Seleccionar…</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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

        {/* ── RUTA ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader label="Ruta" />
          <div className="p-4">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_1fr] items-end gap-2">

              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salida</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PZO"
                        maxLength={4}
                        className="font-mono text-base font-semibold uppercase tracking-widest"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex h-9 items-center gap-0.5 pb-0.5 text-muted-foreground/40">
                <div className="h-px w-3 bg-muted-foreground/30" />
                <Plane className="h-3 w-3 -rotate-45" />
                <div className="h-px w-3 bg-muted-foreground/30" />
              </div>

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CCS"
                        maxLength={4}
                        className="font-mono text-base font-semibold uppercase tracking-widest"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex h-9 items-center pb-0.5">
                <div className="h-4 w-px bg-border" />
              </div>

              <FormField
                control={form.control}
                name="departure_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      Salida
                    </FormLabel>
                    <FormControl>
                      <Input type="time" className="tabular-nums" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrival_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      Llegada
                    </FormLabel>
                    <FormControl>
                      <Input type="time" className="tabular-nums" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ── TRIPULACIÓN Y MÉTRICAS ─────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-background">
          <SectionHeader label="Tripulación y Métricas" />
          <div className="grid grid-cols-3 gap-4 p-4">

            <FormField
              control={form.control}
              name="aircraft_operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    Piloto / Operador
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
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
                  <FormLabel>Horas de Vuelo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        className="pr-7 tabular-nums"
                        {...field}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                        h
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
                  <FormLabel>Ciclos</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        className="pr-10 tabular-nums"
                        {...field}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                        cyc
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditMode ? (
            "Actualizar Vuelo"
          ) : (
            "Registrar Vuelo"
          )}
        </Button>

      </form>
    </Form>
  );
}
