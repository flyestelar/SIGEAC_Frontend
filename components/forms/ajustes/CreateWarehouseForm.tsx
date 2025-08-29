"use client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useCreateWarehouse } from "@/actions/mantenimiento/almacen/almacenes/actions"
import { Input } from "@/components/ui/input"
import { useGetCompanies } from "@/hooks/sistema/useGetCompanies"
import { useGetLocationsByCompanyId } from "@/hooks/sistema/useGetLocationsByCompanyId"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useGetLocationsByCompany } from "@/hooks/sistema/useGetLocationsByCompany"
import { useCompanyStore } from "@/stores/CompanyStore"

const formSchema = z.object({
  name: z.string().min(2).max(50),
  location_id: z.string({
    message: "Debe seleccionar una ubicación."
  }),
  type: z.string(),
})


const CreateWarehouseForm = () => {

  const { selectedCompany } = useCompanyStore()


  const { data: locations, isLoading } = useGetLocationsByCompany();

  const { createWarehouse } = useCreateWarehouse()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location_id: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formattedValues = {
      ...values,
      location_id: Number(values.location_id),
    }
    createWarehouse.mutate(formattedValues)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del almácen</FormLabel>
              <FormControl>
                <Input placeholder="EJ: A-001" {...field} />
              </FormControl>
              <FormDescription>
                Este será el nombre de su almácen.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder={isLoading ? <Loader2 className="size-4 animate-spin" /> : "Seleccione un tipo..."} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="AERONAUTICO">Aeronáutico</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Seleccione el tipo del almácen.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <Select onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger disabled={isLoading}>
                    <SelectValue placeholder={isLoading ? <Loader2 className="size-4 animate-spin" /> : "Seleccione una ubicacion..."} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {
                    isLoading ? <Loader2 className="size-4 animate-spin" />
                      :
                      locations && locations.map((location) => (
                        <SelectItem key={location.cod_iata} value={location.id.toString()}>{location.cod_iata} - {location.type}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
              <FormDescription>
                Seleccione la ubicación en la cual se encuentrael almácen.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="bg-primary mt-2 text-white hover:bg-blue-900 disabled:bg-primary/70" disabled={createWarehouse?.isPending} type="submit">
          {createWarehouse?.isPending ? <Loader2 className="size-4 animate-spin" /> : <p>Crear Almácen</p>}
        </Button>
      </form>
    </Form>
  )
}

export default CreateWarehouseForm
