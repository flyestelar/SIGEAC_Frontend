'use client'

import { useCreateArticle } from "@/actions/mantenimiento/almacen/inventario/articulos/actions"
import { MultiInputField } from "@/components/misc/MultiInputField"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useGetConditions } from "@/hooks/administracion/useGetConditions"
import { useGetBatchesByCategory } from "@/hooks/mantenimiento/almacen/renglones/useGetBatchesByCategory"
import { useCompanyStore } from "@/stores/CompanyStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileUpIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// ✅ esquema de validación
const MAX_FILE_SIZE = 100 * 1024 // 100 KB

const fileSchema = z
  .instanceof(File, { message: "Debe subir un archivo válido." })
  .refine((f) => f.size <= MAX_FILE_SIZE, "El archivo no debe superar los 100Kb.")
  .optional()

const formSchema = z
  .object({
    part_number: z.string().min(2, "El número de parte debe tener al menos 2 caracteres."),
    alternative_part_number: z
      .array(z.string().min(2, "Cada número alterno debe tener al menos 2 caracteres."))
      .optional(),
    serial: z.string().min(2, "El serial debe tener al menos 2 caracteres."),
    description: z.string().min(2, "La descripción es requerida."),
    batch_id: z.string({ message: "Debe seleccionar un lote." }),
    condition_id: z.string({ required_error: "Debe seleccionar una condición." }),
    zone: z.string().min(1, "Debe ingresar la zona."),
    needs_calibration: z.boolean().default(false),
    last_calibration_date: z.string().optional(),
    calibration_interval_days: z.string().optional(),
    image: fileSchema,
    certificate_8130: fileSchema,
    certificate_fabricant: fileSchema,
    certificate_vendor: fileSchema,
  })
  .refine(
    (data) => {
      if (data.needs_calibration) {
        return data.last_calibration_date && data.calibration_interval_days
      }
      return true
    },
    {
      message: "Debe ingresar fecha e intervalo de calibración.",
      path: ["last_calibration_date"],
    }
  )

export function CreateToolForm() {
  const { selectedCompany } = useCompanyStore()

  const { data: conditions, isLoading: isConditionsLoading } = useGetConditions()

  const { data: batches, isPending: isBatchesLoading, isError } = useGetBatchesByCategory("herramienta");

  const { createArticle } = useCreateArticle()

  const [needsCalibration, setNeedsCalibration] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      part_number: "",
      alternative_part_number: [],
      serial: "",
      description: "",
      condition_id: "",
      zone: "",
      needs_calibration: false,
      last_calibration_date: "",
      calibration_interval_days: "",
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form data:", values)
    createArticle.mutateAsync({ company: selectedCompany!.slug, data: values })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-7xl mx-auto">
        {/* Numero de parte + alternos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="serial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: SN-98765" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="part_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Parte</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 123ABC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alternative_part_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nros. de Parte Alternos</FormLabel>
                <FormControl>
                  <MultiInputField
                    values={field.value || []}
                    onChange={field.onChange}
                    placeholder="Ej: ALT-456"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Ej: Torquímetro digital 1/2 pulgada..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Condición + Zona */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="condition_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condición</FormLabel>
                <Select disabled={isConditionsLoading} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isConditionsLoading ? "Cargando..." : "Seleccione..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {conditions?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
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
            name="zone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zona</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Pasillo A-3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="batch_id"
            render={({ field }) => (
              <FormItem className={"col-span-1"}>
                <FormLabel>Lote del Articulo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isBatchesLoading ? <Loader2 className="size-4 animate-spin" /> : "Seleccione lote..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {
                      batches && batches.map((batch) => (
                        <SelectItem key={batch.name} value={batch.id.toString()}>{batch.name} - {batch.warehouse_name}</SelectItem>
                      ))
                    }
                    {
                      !batches || batches?.length <= 0 && (
                        <p className="text-sm text-muted-foreground p-2 text-center">No se han encontrado lotes....</p>
                      )
                    }
                    {
                      isError && (
                        <p className="text-sm text-muted-foreground p-2 text-center">Ha ocurrido un error al cargar los lotes...</p>
                      )
                    }
                  </SelectContent>
                </Select>
                <FormDescription>
                  Lote a asignar el articulo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checkbox calibración */}
        <FormField
          control={form.control}
          name="needs_calibration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(!!checked)
                    setNeedsCalibration(!!checked)
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>¿Requiere calibración?</FormLabel>
                <FormDescription>Si se activa, deberá ingresar fecha e intervalo.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Campos condicionales de calibración */}
        {needsCalibration && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="last_calibration_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Última Fecha de Calibración</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calibration_interval_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intervalo (días)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 180" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Imagen */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen del Artículo</FormLabel>
              <FormControl>
                <div className="relative h-10 w-full">
                  <FileUpIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    type="file"
                    onChange={(e) => form.setValue("image", e.target.files?.[0])}
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Certificados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="certificate_8130"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificado 8130</FormLabel>
                <FormControl>
                  <Input type="file" onChange={(e) => form.setValue("certificate_8130", e.target.files?.[0])} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="certificate_fabricant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificado Fabricante</FormLabel>
                <FormControl>
                  <Input type="file" onChange={(e) => form.setValue("certificate_fabricant", e.target.files?.[0])} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="certificate_vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificado Vendedor</FormLabel>
                <FormControl>
                  <Input type="file" onChange={(e) => form.setValue("certificate_vendor", e.target.files?.[0])} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botón submit */}
        <div className="flex justify-end">
          <Button type="submit" className="bg-primary text-white">
            Guardar
          </Button>
        </div>
      </form>
    </Form>
  )
}
