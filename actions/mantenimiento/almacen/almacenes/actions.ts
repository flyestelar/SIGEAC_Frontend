import axiosInstance from "@/lib/axios"
import { useCompanyStore } from "@/stores/CompanyStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface createWarehouseSchema {
  name: string,
  location_id: number,
  type: string,
}

export const useCreateWarehouse = () => {

  const { selectedCompany } = useCompanyStore()

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: createWarehouseSchema) => {
      await axiosInstance.post(`/${selectedCompany?.slug}/warehouses`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast("¡Creado!", {
        description: `¡El almacén se ha creado correctamente!`
      })
    },
    onError: (error) => {
      toast('Hey', {
        description: `No se creo correctamente: ${error}`
      })
    },
  }
  )

  return {
    createWarehouse: createMutation,
  }
}

export const useDeleteWarehouse = () => {

  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: string, company: string }) => {
      await axiosInstance.post(`/warehouse-delete/${id}`, { company: company })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast.success("¡Eliminado!", {
        description: `¡El almacén ha sido eliminado correctamente!`
      })
    },
    onError: (e) => {
      toast.error("Oops!", {
        description: "¡Hubo un error al eliminar el almacén!"
      })
    },
  }
  )

  return {
    deleteWarehouse: deleteMutation,
  }
}
