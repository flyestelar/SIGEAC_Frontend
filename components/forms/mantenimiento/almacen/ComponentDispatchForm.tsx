"use client"

import { useCreateDispatchRequest } from "@/actions/mantenimiento/almacen/solicitudes/salida/action"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { useGetWarehousesEmployees } from "@/hooks/mantenimiento/almacen/empleados/useGetWarehousesEmployees"
import { useGetBatchesWithInWarehouseArticles } from "@/hooks/mantenimiento/almacen/renglones/useGetBatchesWithInWarehouseArticles"
import { useGetMaintenanceAircrafts } from "@/hooks/planificacion/useGetMaintenanceAircrafts"
import { useGetWorkshopsByLocation } from "@/hooks/sistema/empresas/talleres/useGetWorkshopsByLocation"
import { useGetEmployeesByDepartment } from "@/hooks/sistema/useGetEmployeesByDepartament"
import { cn } from "@/lib/utils"
import { useCompanyStore } from "@/stores/CompanyStore"
import { Article, Batch } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Calendar } from "../../../ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover"
import { Textarea } from "../../../ui/textarea"

const FormSchema = z.object({
  dispatch_type: z.enum(["aircraft", "workshop"], {
    message: "Debe seleccionar si el despacho es para una Aeronave o un Taller.",
  }),
  requested_by: z.string(),
  delivered_by: z.string(),
  aircraft_id: z.string().optional(),
  workshop_id: z.string().optional(),
  submission_date: z.date({
    message: "Debe ingresar la fecha."
  }),
  articles: z.array(z.object({
    article_id: z.coerce.number(),
    serial: z.string().nullable(),
    quantity: z.number(),
    batch_id: z.number(),
  }), {
    message: "Debe seleccionar el (los) articulos que se van a despachar."
  }),
  justification: z.string({
    message: "Debe ingresar una justificación de la salida."
  }).optional(),
}).refine(
  (data) =>
    (data.dispatch_type === "aircraft" && !!data.aircraft_id) ||
    (data.dispatch_type === "workshop" && !!data.workshop_id),
  {
    message: "Debe seleccionar una Aeronave o un Taller según corresponda.",
    path: ["dispatch_type"],
  }
)


type FormSchemaType = z.infer<typeof FormSchema>

interface FormProps {
  onClose: () => void
}

interface BatchesWithCountProp extends Batch {
  articles: Article[],
  batch_id: number,
}

export function ComponentDispatchForm({ onClose }: FormProps) {

  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const [articleSelected, setArticleSelected] = useState<Article>();

  const { createDispatchRequest } = useCreateDispatchRequest();

  const { selectedCompany } = useCompanyStore();

  const [selectedAircraft, setSelectedAircraft] = useState<string>("");

  const [selectedWorkshop, setSelectedWorkshop] = useState<string>("");


  const { data: batches, isLoading: isBatchesLoading, isError: isBatchesError } = useGetBatchesWithInWarehouseArticles();

  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useGetEmployeesByDepartment("MANP");

  const { data: warehouseEmployees, isLoading: warehouseEmployeesLoading, isError: warehouseEmployeesError } = useGetWarehousesEmployees();

  const { data: aircrafts, isLoading: isAircraftsLoading, isError: isAircraftsError } = useGetMaintenanceAircrafts(selectedCompany?.slug);

  const { data: workshops, isLoading: isWorkshopsLoading, isError: isWorkshopsError } = useGetWorkshopsByLocation();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      articles: [],
      justification: "",
      requested_by: `${user?.first_name} ${user?.last_name}`,
    },
  });

  const { setValue } = form;

  const onSubmit = async (data: FormSchemaType) => {
    const formattedData = {
      ...data,
      created_by: user?.first_name + " " + user?.last_name,
      submission_date: format(data.submission_date, "yyyy-MM-dd"),
      status: "APROBADO",
      category: "componente",
      approved_by: user?.employee[0].dni,
      delivered_by: data.delivered_by,
      user_id: Number(user!.id),
    }
    await createDispatchRequest.mutateAsync({
      data: {
        ...formattedData,
        user_id: Number(user!.id)
      },
      company: selectedCompany!.slug
    });
    onClose();
  }

  const handleArticleSelect = (id: number, serial: string | null, batch_id: number) => {
    setValue('articles', [{ article_id: Number(id), serial: serial ? serial : null, quantity: 1, batch_id: Number(batch_id) }])
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3 w-full">
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
                      checked={field.value === "aircraft"}
                      onChange={() => field.onChange("aircraft")}
                    />
                    <span>Aeronave</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="workshop"
                      checked={field.value === "workshop"}
                      onChange={() => field.onChange("workshop")}
                    />
                    <span>Taller</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {
          form.watch("dispatch_type") === "aircraft" && (
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
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        }
        {
          form.watch("dispatch_type") === "workshop" && (
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
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {
                            isWorkshopsLoading && <Loader2 className="size-4 animate-spin mr-2" />
                          }
                          {field.value
                            ? <p>{workshops?.find(
                              (ws) => `${ws.id.toString()}` === field.value
                            )?.name}</p>
                            : "Elige el taller..."
                          }
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Busque un taller..." />
                        <CommandList>
                          <CommandEmpty className="text-xs p-2 text-center">No se ha encontrado ningun taller .</CommandEmpty>
                          <CommandGroup>
                            {workshops?.map((workshop) => (
                              <CommandItem
                                value={`${workshop.id}`}
                                key={workshop.id}
                                onSelect={() => {
                                  form.setValue("workshop_id", workshop.id.toString());
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    `${workshop.id.toString()}` === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {
                                  <p>{workshop.name}</p>
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
          )
        }
        <FormField
          control={form.control}
          name="articles"
          render={({ field }) => (
            <FormItem className="flex flex-col mt-2.5 w-full">
              <FormLabel>Componente a Retirar</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={isBatchesLoading || isBatchesError}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between"
                  >
                    {articleSelected
                      ? `${articleSelected.part_number} - ${articleSelected.serial ?? "S/N"}`
                      : "Selec. el componente"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Selec. el componente..." />
                    <CommandList>
                      <CommandEmpty>No se han encontrado componentes...</CommandEmpty>
                      {
                        batches?.map((batch) => (
                          <CommandGroup key={batch.batch_id} heading={batch.name}>
                            {
                              batch.articles.map((article) => (
                                <CommandItem value={`${batch.name} ${article.part_number} ${article.serial} ${article.id}`} key={article.id} onSelect={() => {
                                  handleArticleSelect(article.id!, article?.serial ?? null, batch.batch_id)
                                  setArticleSelected(article)
                                }}><Check className={cn("mr-2 h-4 w-4", articleSelected?.id === article.id ? "opacity-100" : "opacity-0")} />
                                  {article.serial ?? "N/A"}</CommandItem>
                              ))
                            }
                          </CommandGroup>
                        ))
                      }
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="delivered_by"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Entregado por:</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el responsable..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {
                      warehouseEmployeesLoading && <Loader2 className="size-4 animate-spin" />
                    }
                    {
                      warehouseEmployees && warehouseEmployees.map((employee) => (
                        <SelectItem key={employee.dni} value={`${employee.dni}`}>{employee.first_name} {employee.last_name}</SelectItem>
                      ))
                    }
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
              <FormItem className="w-full ">
                <FormLabel>Recibe / MTTO</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger disabled={employeesLoading || employeesError}>
                      <SelectValue placeholder={employeesLoading ? <Loader2 className="animate-spin" /> : "Seleccione el responsable..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {
                      employeesLoading && <Loader2 className="size-4 animate-spin" />
                    }
                    {
                      employees && employees.map((employee) => (
                        <SelectItem key={employee.id} value={`${employee.dni}`}>{employee.first_name} {employee.last_name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-2">
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
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", {
                            locale: es
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
        <FormField
          control={form.control}
          name="justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificacion</FormLabel>
              <FormControl>
                <Textarea rows={5} className="w-full" placeholder="EJ: Se necesita para la limpieza de..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button className="bg-primary mt-2 text-white hover:bg-blue-900 disabled:bg-primary/70" disabled={createDispatchRequest?.isPending} type="submit">
          {createDispatchRequest?.isPending ? <Loader2 className="size-4 animate-spin" /> : <p>Crear</p>}
        </Button>
      </form>
    </Form >
  )
}
