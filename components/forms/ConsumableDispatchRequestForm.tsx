"use client"

import { useCreateDispatchRequest } from "@/actions/almacen/solicitudes/salida/action"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { useGetBatchesWithInWarehouseArticles } from "@/hooks/almacen/useGetBatchesWithInWarehouseArticles"
import { useGetWorkOrderEmployees } from "@/hooks/planificacion/useGetWorkOrderEmployees"
import { useGetWorkOrders } from "@/hooks/planificacion/useGetWorkOrders"
import { cn } from "@/lib/utils"
import { useCompanyStore } from "@/stores/CompanyStore"
import { Article, Batch } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Calendar } from "../ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Textarea } from "../ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "../ui/label"


const FormSchema = z.object({
  requested_by: z.string(),
  submission_date: z.date({
    message: "Debe ingresar la fecha."
  }),
  articles: z.object({
    article_id: z.coerce.number(),
    serial: z.string().nullable(),
    quantity: z.number(),
    batch_id: z.number(),
  }),
  justification: z.string({
    message: "Debe ingresar una justificación de la salida."
  }),
  destination_place: z.string(),
  status: z.string(),
})

type FormSchemaType = z.infer<typeof FormSchema>

interface FormProps {
  onClose: () => void
}

interface BatchesWithCountProp extends Batch {
  articles: Article[],
  batch_id: number,
}

export function ConsumableDispatchForm({ onClose }: FormProps) {

  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const [quantity, setQuantity] = useState("");

  const [openBatches, setOpenBatches] = useState(false);

  const [filteredBatches, setFilteredBatches] = useState<BatchesWithCountProp[]>([]);

  const [articleSelected, setArticleSelected] = useState<Article>();

  const { createDispatchRequest } = useCreateDispatchRequest();

  const { selectedStation } = useCompanyStore();

  const { mutate, data: batches, isPending: isBatchesLoading, isError } = useGetBatchesWithInWarehouseArticles();

  const { data: employees, isLoading: employeesLoading, isError: employeesError } = useGetWorkOrderEmployees();

  const { mutate: workOrderMutate, data: workOrders, isPending } = useGetWorkOrders();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      justification: "",
      requested_by: `${user?.first_name} ${user?.last_name}`,
      destination_place: "",
      status: "proceso",
    },
  });

  useEffect(() => {
    if (selectedStation) {
      mutate(Number(selectedStation))
      workOrderMutate(Number(selectedStation))
    }
  }, [selectedStation, mutate, workOrderMutate])

  useEffect(() => {
    if (batches) {
      // Filtrar los batches por categoría
      const filtered = batches.filter((batch) => batch.category === "consumible");
      setFilteredBatches(filtered);
    }
  }, [batches]);


  useEffect(() => {
    const article = form.getValues("articles")
    form.setValue(
      "articles",
      {
        ...article,
        quantity: parseFloat(quantity),
      }
    );
  }, [form, quantity])

  const { setValue } = form;

  const onSubmit = async (data: FormSchemaType) => {
    const formattedData = {
      ...data,
      articles: [{ ...data.articles }],
      created_by: user?.first_name + " " + user?.last_name,
      submission_date: format(data.submission_date, "yyyy-MM-dd"),
      category: "consumible",
      user_id: user!.id
    }
    // console.log(formattedData)
    await createDispatchRequest.mutateAsync(formattedData);
    onClose();
  }

  const handleArticleSelect = (id: number, serial: string | null, batch_id: number) => {
    setValue('articles', { article_id: Number(id), serial: serial ? serial : null, quantity: 0, batch_id: Number(batch_id) })
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-3 w-full">
        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="requested_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recibe / MTTO</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el responsable..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {
                      employeesLoading && <Loader2 className="size-4 animate-spin" />
                    }
                    {
                      employees && employees.map((employee) => (
                        <SelectItem key={employee.id} value={`${employee.first_name} ${employee.last_name}`}>{employee.first_name} {employee.last_name} - {employee.job_title.name}</SelectItem>
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
            name="submission_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel>Fecha de Solicitud</FormLabel>
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
          <FormField
            control={form.control}
            name="destination_place"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Destino</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Jefatura de Desarrollo, etc..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="articles"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Componente a Retirar</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                      >
                        {articleSelected
                          ? `${articleSelected.description}`
                          : "Selec. el consumible"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar un consu..." />
                        <CommandList>
                          <CommandEmpty>No se han encontrado consumibles...</CommandEmpty>
                          {
                            filteredBatches?.map((batch) => (
                              <CommandGroup key={batch.batch_id} heading={batch.name}>
                                {
                                  batch.articles.map((article) => (
                                    <CommandItem key={article.id} onSelect={() => {
                                      handleArticleSelect(article.id!, article.serial ? article.serial : null, batch.batch_id)
                                      setArticleSelected(article)
                                    }}><Check className={cn("mr-2 h-4 w-4", articleSelected?.id === article.id ? "opacity-100" : "opacity-0")} />
                                      {article.description} - {article.quantity}L</CommandItem>
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
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col space-y-2">
                <Label>Cantidad</Label>
                <Input
                  disabled={!articleSelected}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    // Validar contra la cantidad disponible
                    if (articleSelected && value > articleSelected.quantity!) {
                      setQuantity(articleSelected.quantity!.toString());
                    } else {
                      setQuantity(e.target.value);
                    }

                    // Actualizar la cantidad en el objeto de article
                  }}
                  placeholder="Ej: 1, 4, 6, etc..."
                />
              </div>
              <RadioGroup defaultValue="option-one">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-one" id="option-one" />
                  <Label htmlFor="option-one">Litros</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-two" id="option-two" />
                  <Label htmlFor="option-two">Mililitros</Label>
                </div>
              </RadioGroup>
            </div>
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
        </div>

        <Button className="bg-primary mt-2 text-white hover:bg-blue-900 disabled:bg-primary/70" disabled={createDispatchRequest?.isPending} type="submit">
          {createDispatchRequest?.isPending ? <Loader2 className="size-4 animate-spin" /> : <p>Crear</p>}
        </Button>
      </form >
    </Form >
  )
}
