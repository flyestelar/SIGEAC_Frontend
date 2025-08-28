"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useGetClients } from "@/hooks/general/clientes/useGetClients"
import { useGetManufacturers } from "@/hooks/general/condiciones/useGetConditions"
import { useGetLocationsByCompanyId } from "@/hooks/sistema/useGetLocationsByCompanyId"
import { cn } from "@/lib/utils"
import { useCompanyStore } from "@/stores/CompanyStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Calendar } from "../../../ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"
import { Textarea } from "../../../ui/textarea"

// Esquema de validación para el Paso 1 (Información de la aeronave)
const AircraftInfoSchema = z.object({
  manufacturer_id: z.string().min(1, "Debe seleccionar un fabricante"),
  serial: z.string().min(1, "El serial es obligatorio"),
  model: z.string().min(1, "El modelo es obligatorio"),
  acronym: z.string().min(1, "El acrónimo es obligatorio"),
  flight_hours: z.string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0;
    }, "Debe ser un número entero mayor o igual a 0"),
  flight_cycles: z.string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0;
    }, "Debe ser un número entero mayor o igual a 0"),
  fabricant_date: z.date(),
  comments: z.string().optional(),
  location_id: z.string().min(1, "La ubicación es obligatoria"),
});

type AircraftInfoType = z.infer<typeof AircraftInfoSchema>;

interface AircraftInfoFormProps {
  onNext: (data: AircraftInfoType) => void; // Función para avanzar al siguiente paso
  onBack?: () => void; // Función para retroceder (opcional)
  initialData?: Partial<AircraftInfoType>; // Datos iniciales (opcional)
}

export function AircraftInfoForm({ onNext, onBack, initialData }: AircraftInfoFormProps) {
  const { selectedCompany } = useCompanyStore()
  const { data: clients, isLoading: isClientsLoading, isError: isClientsError } = useGetClients(selectedCompany?.slug);
  const { data: locations, isPending: isLocationsLoading, isError: isLocationsError, mutate } = useGetLocationsByCompanyId();
  const { data: manufacturers, isLoading: isManufacturersLoading, isError: isManufacturersError } = useGetManufacturers(selectedCompany?.slug);

  useEffect(() => {
    mutate(2)
  }, [mutate])
  const form = useForm<AircraftInfoType>({
    resolver: zodResolver(AircraftInfoSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = (data: AircraftInfoType) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3">
        <div className='grid grid-cols-1 md:grid-cols-2 w-full gap-4'>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="manufacturer_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-3 mt-1.5 w-full">
                  <FormLabel>Fabricante</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={isManufacturersLoading || isManufacturersError}
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {
                            isClientsLoading && <Loader2 className="size-4 animate-spin mr-2" />
                          }
                          {field.value
                            ? <p>{manufacturers?.find(
                              (manufacturer) => `${manufacturer.id.toString()}` === field.value
                            )?.name}</p>
                            : "Elige al fabricante..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Busque un fabricante..." />
                        <CommandList>
                          <CommandEmpty className="text-sm p-2 text-center">No se ha encontrado ningún fabricante.</CommandEmpty>
                          <CommandGroup>
                            {manufacturers?.filter((m) => m.type === 'AIRCRAFT').map((manufacturer) => (
                              <CommandItem
                                value={`${manufacturer.id}`}
                                key={manufacturer.id}
                                onSelect={() => {
                                  form.setValue("manufacturer_id", manufacturer.id.toString())
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    `${manufacturer.id.toString()}` === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {
                                  <p>{manufacturer.name}</p>
                                }
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
              name="model"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="Modelo de la aeronave..." {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            /></div>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="acronym"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Acronimo</FormLabel>
                  <FormControl>
                    <Input placeholder="YVXXXX" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serial"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Serial</FormLabel>
                  <FormControl>
                    <Input placeholder="Serial de la aeronave..." {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <FormField
            control={form.control}
            name="fabricant_date"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2 mt-2.5">
                <FormLabel>Fecha de Fabricación</FormLabel>
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
                          <span>Seleccione una fecha</span>
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
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicacion</FormLabel>
                <Select disabled={isLocationsLoading || isLocationsError} onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {
                      locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>{location.address} - {location.type}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col md:flex-row w-full gap-2">
          <div className="flex md:flex-col gap-2 w-full md:w-1/3">
            <FormField
              control={form.control}
              name="flight_hours"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Horas de Vuelo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 15000"
                      {...field}
                      onKeyDown={(e) => {
                        // Prevenir números negativos y decimales
                        if (e.key === '-' || e.key === '.' || e.key === ',') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flight_cycles"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ciclos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 500"
                      {...field}
                      onKeyDown={(e) => {
                        // Prevenir números negativos y decimales
                        if (e.key === '-' || e.key === '.' || e.key === ',') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Comentarios</FormLabel>
                <FormControl>
                  <Textarea className="resize-none" rows={5} placeholder="Aeronave de - " {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Comentarios adicionales.
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-between items-center gap-x-4">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Anterior
            </Button>
          )}
          <Button type="submit">Siguiente</Button>
        </div>
      </form>
    </Form>
  );
}
