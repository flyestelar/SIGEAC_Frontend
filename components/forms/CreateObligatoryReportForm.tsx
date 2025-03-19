"use client";

import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useEffect, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown, ClockIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useGetPilots } from "@/hooks/sms/useGetPilots";
import { useCreateObligatoryReport, useUpdateObligatoryReport } from "@/actions/sms/reporte_obligatorio/actions";
import { ObligatoryReport } from "@/types";
import { dataTagSymbol } from "@tanstack/react-query";

//Falta añadir validaciones

function timeFormat(date: Date) {
  const timeString = date.toString();
  const parsedTime = parse(timeString, "HH:mm:ss", new Date());
  return parsedTime;
}

const FormSchema = z
  .object({
    report_code: z.string(),
    report_date: z
      .date()
      .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),
    incident_date: z
      .date()
      .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),
    incident_time: z
      .date()
      .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),
    flight_time: z
      .date()
      .refine((val) => !isNaN(val.getTime()), { message: "Invalid Date" }),
    pilot_id: z.string(),
    copilot_id: z.string(),
    aircraft_acronym: z.string().min(3),
    aircraft_model: z.string().min(3),
    flight_number: z.string().min(3),
    flight_origin: z.string().min(3),
    flight_destiny: z.string().min(3),
    flight_alt_destiny: z.string().min(3),
    incidents: z.array(z.string()).optional(),
    other_incidents: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasIncidents = data.incidents && data.incidents.length > 0;
      const hasOtherIncidents =
        data.other_incidents && data.other_incidents.trim() !== "";

      // Return true if either field is valid or both are valid
      return hasIncidents || hasOtherIncidents;
    },
    {
      message:
        "At least one of 'incidents' or 'other_incidents' must be provided.",
      path: ["incidents", "other_incidents"], // Optional, to highlight both fields in error
    }
  );
type FormSchemaType = z.infer<typeof FormSchema>;

interface FormProps {
  isEditing?: boolean;
  initialData?: ObligatoryReport;
  onClose: () => void;
}

export function CreateObligatoryReportForm({
  onClose,
  isEditing,
  initialData,
}: FormProps) {
  const { createObligatoryReport } = useCreateObligatoryReport();
  const { updateObligatoryReport } = useUpdateObligatoryReport();

  const [showOtherInput, setShowOtherInput] = useState(
    initialData?.other_incidents ? true : false
  );

  const [open, setOpen] = useState(false);

  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    if (initialData?.incidents) {
      try {
        return JSON.parse(initialData.incidents);
      } catch (error) {
        console.error("Error al parsear initialData.incidents:", error);
        return []; // Devuelve un array vacío en caso de error de parseo
      }
    }
    return []; // Devuelve un array vacío si initialData?.incidents es null o undefined
  });

  // No estoy seguro si esto va aca lol
  const { data: pilots, isLoading } = useGetPilots();

  const OPTIONS_LIST = [
    "La aereonave aterriza quedándose solo con el combustible de reserva o menos",
    "Incursion en pista o calle de rodaje ( RUNAWAY INCURSION-RI)",
    "Aproximacion no estabilizada por debajo de los 500 pies VRF o 1000 PIES IRF",
    "Desprezurizacion",
    "Salida de pista - RUNAWAY INCURSION",
    "Derrame de combustible",
    "Error  de navegacion con desviacion significativa de la ruta",
    "Casi colision (RESOLUCION ACVSORY-RA)",
    "Despegue abortado(REJETED TAKE OFF-RTO)",
    "Falla de motor",
    "Tail Strike",
    "Impacto con aves",
    "Aterrizaje fuerte (HARD LANDING)",
    "Alerta de fuego o humo",
    "Wind Shear",
    "El avion es evacuado",
    "Fallo en los controles de vuelo",
    "Parametros de vuelo anormales",
  ];

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      aircraft_acronym: initialData?.aircraft_acronym,
      aircraft_model: initialData?.aircraft_model,
      pilot_id: initialData?.pilot_id.toString(),
      copilot_id: initialData?.copilot_id.toString(),
      flight_alt_destiny: initialData?.flight_alt_destiny,
      flight_destiny: initialData?.flight_destiny,
      flight_number: initialData?.flight_number,
      flight_origin: initialData?.flight_origin,
      other_incidents: initialData?.other_incidents,
      report_code: initialData?.report_code,
      report_date: initialData?.report_date
        ? new Date(initialData?.report_date)
        : new Date(),
      incident_date: initialData?.incident_date
        ? new Date(initialData?.incident_date)
        : new Date(),

      flight_time: initialData?.flight_time
        ? timeFormat(initialData?.flight_time)
        : new Date(),
      incident_time: initialData?.incident_time
        ? timeFormat(initialData?.incident_time)
        : new Date(),
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    if (isEditing && initialData){
        const value = {
          id: initialData.id,
          report_code: data.report_code,
          incident_date: data.incident_date,
          report_date: data.report_date,
          incident_time: format(data.incident_time, "HH:mm:ss"),
          flight_time: format(data.flight_time, "HH:mm:ss"),
          pilot_id: data.pilot_id,
          copilot_id: data.pilot_id,
          aircraft_acronym: data.aircraft_acronym,
          aircraft_model: data.aircraft_model,
          flight_number: data.flight_number,
          flight_origin: data.flight_origin,
          flight_destiny: data.flight_destiny,
          flight_alt_destiny: data.flight_alt_destiny,
          incidents: data.incidents,
          other_incidents: data.other_incidents,
        }
        console.log("THIS IS VALUE FROM EDIT AND INITIAL DATA", value);
        await updateObligatoryReport.mutateAsync(value);
    } else {
      const value = {
        report_code: data.report_code,
        incident_date: data.incident_date,
        report_date: data.report_date,
        incident_time: format(data.incident_time, "HH:mm:ss"),
        flight_time: format(data.flight_time, "HH:mm:ss"),
        pilot_id: data.pilot_id,
        copilot_id: data.pilot_id,
        aircraft_acronym: data.aircraft_acronym,
        aircraft_model: data.aircraft_model,
        flight_number: data.flight_number,
        flight_origin: data.flight_origin,
        flight_destiny: data.flight_destiny,
        flight_alt_destiny: data.flight_alt_destiny,
        incidents: data.incidents,
        other_incidents: data.other_incidents,
        status: "ABIERTO",
      };
      console.log("THIS IS VALUE FROM CREATE ", value);
      await createObligatoryReport.mutateAsync(value);
    }
    onClose();
  };

  const handleOtherCheckboxChange = (checked: boolean) => {
    setShowOtherInput(checked);
    if (!checked) {
      form.setValue("other_incidents", "");
    }
  };

  const handleOtherInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    form.setValue("other_incidents", event.target.value);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-3"
      >
        <FormLabel className="text-lg text-center m-2">
          Reporte Obligatorio de suceso
        </FormLabel>

        <FormField
          control={form.control}
          name="report_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Codigo del Reporte</FormLabel>
              <FormControl>
                <Input placeholder="RSO-123" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="flex gap-2 items-center justify-center">
          <FormField
            control={form.control}
            name="report_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel>Fecha de reporte del incidente</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", {
                            locale: es,
                          })
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="incident_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel>Fecha del incidente</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", {
                            locale: es,
                          })
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
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

        <div className="flex gap-2 justify-center items-center">
          <FormField
            control={form.control}
            name="pilot_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Piloto</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Piloto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pilots &&
                      pilots.map((pilot) => (
                        <SelectItem key={pilot.id} value={pilot.id.toString()}>
                          {pilot.first_name} {pilot.last_name}
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
            name="copilot_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Copiloto</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Copiloto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pilots &&
                      pilots.map((pilot) => (
                        <SelectItem key={pilot.id} value={pilot.id.toString()}>
                          {pilot.first_name} {pilot.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-center items-center">
          <FormField
            control={form.control}
            name="incident_time"
            render={({ field }) => {
              const handleChange = (event: { target: { value: any } }) => {
                const timeString = event.target.value;
                const time = parse(timeString, "HH:mm", new Date());
                if (isValid(time)) {
                  field.onChange(time);
                }
              };

              return (
                <FormItem className="w-full">
                  <FormLabel>Indicar hora del incidente</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "HH:mm") // Formato 24 horas
                          ) : (
                            <span>Seleccionar Hora</span>
                          )}
                          <ClockIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <input
                        type="time"
                        value={field.value ? format(field.value, "HH:mm") : ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="flight_time"
            render={({ field }) => {
              const handleChange = (event: { target: { value: any } }) => {
                const timeString = event.target.value;
                const time = parse(timeString, "HH:mm", new Date());
                if (isValid(time)) {
                  field.onChange(time);
                }
              };

              return (
                <FormItem className="w-full">
                  <FormLabel>Indicar hora de vuelo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "HH:mm") // Formato 24 horas
                          ) : (
                            <span>Seleccionar Hora</span>
                          )}
                          <ClockIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <input
                        type="time"
                        value={field.value ? format(field.value, "HH:mm") : ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        <div className="flex gap-2 justify-center items-center">
          <FormField
            control={form.control}
            name="aircraft_acronym"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Matricula de la aereonave</FormLabel>
                <FormControl>
                  <Input placeholder="Matricula de aereonave" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aircraft_model"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Modelo de la aereonave</FormLabel>
                <FormControl>
                  <Input placeholder="Modelo de aereonave" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2 justify-center items-center">
          <FormField
            control={form.control}
            name="flight_number"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Numero de vuelo</FormLabel>
                <FormControl>
                  <Input placeholder="Numero del vuelo" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="flight_origin"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Origen de vuelo</FormLabel>
                <FormControl>
                  <Input placeholder="Salida del vuelo" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-center items-center">
          <FormField
            control={form.control}
            name="flight_destiny"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Destino de vuelo</FormLabel>
                <FormControl>
                  <Input placeholder="Destino del vuelo" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="flight_alt_destiny"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Destino alterno del vuelo</FormLabel>
                <FormControl>
                  <Input placeholder="Destino alterno del vuelo" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="incidents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Incidentes:</FormLabel>
              <FormControl>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-[300px] justify-between"
                    >
                      {selectedValues && selectedValues.length > 0 ? (
                        <p>({selectedValues.length}) seleccionados</p>
                      ) : (
                        "Seleccionar opciones..."
                      )}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar opciones..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                        <CommandGroup>
                          {OPTIONS_LIST.map((option) => (
                            <CommandItem
                              key={option}
                              value={option}
                              onSelect={(currentValue) => {
                                const isSelected =
                                  selectedValues.includes(currentValue);
                                const newValues = isSelected
                                  ? selectedValues.filter(
                                      (v) => v !== currentValue
                                    )
                                  : [...selectedValues, currentValue];

                                setSelectedValues(newValues);
                                field.onChange(
                                  newValues.length > 0 ? newValues : []
                                ); // Actualizar el valor del campo de formulario
                              }}
                            >
                              {option}
                              {selectedValues && (
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    selectedValues.includes(option)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="other_incidents" // Campo separado para "other_incidents"
          render={() => (
            <FormItem className="mt-4">
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={showOtherInput}
                    onCheckedChange={handleOtherCheckboxChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Otros incidentes
                </FormLabel>
              </FormItem>
              {showOtherInput && (
                <FormItem className="mt-2">
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Detalles del incidente"
                      {...form.register("other_incidents")}
                      onChange={handleOtherInputChange}
                    />
                  </FormControl>
                </FormItem>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center gap-x-4">
          <Separator className="flex-1" />
          <p className="text-muted-foreground">SIGEAC</p>
          <Separator className="flex-1" />
        </div>
        <Button type="submit">Enviar reporte</Button>
      </form>
    </Form>
  );
}
