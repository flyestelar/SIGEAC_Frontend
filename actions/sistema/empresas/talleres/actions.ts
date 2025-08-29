import axiosInstance from "@/lib/axios"
import { useCompanyStore } from "@/stores/CompanyStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface WorkshopData {
    name: string
    location_id: string,
}

export const useCreateWorkshop = () => {
    const { selectedCompany } = useCompanyStore()
    const queryCategory = useQueryClient()
    const createMutation = useMutation({
        mutationFn: async (data: WorkshopData) => {
            await axiosInstance.post(`/${selectedCompany?.slug}/workshops`, data)
        },
        onSuccess: () => {
            queryCategory.invalidateQueries({ queryKey: ['workshops'] })
            toast("¡Creado!", {
                description: `¡El taller se ha creado correctamente!`
            })
        },
        onError: (error) => {
            toast('Error:(', {
                description: `No se creo correctamente: ${error}`
            })
        },
    }
    )
    return {
        createWorkshop: createMutation,
    }
}


export const useDeleteWorkshop = () => {
    const { selectedCompany } = useCompanyStore()
    const queryCategory = useQueryClient()
    const deleteMutation = useMutation({
        mutationFn: async (id: number | string) => {
            await axiosInstance.delete(`/${selectedCompany?.slug}/workshops/${id}`)
        },
        onSuccess: () => {

            queryCategory.invalidateQueries({ queryKey: ['workshops'] })
            toast.success("¡Eliminado!", {
                description: `¡El taller ha sido eliminado correctamente!`
            })
        },
        onError: (e) => {
            toast.error("Oops!", {
                description: "¡Hubo un error al eliminar el taller!"
            })
        },
    }
    )
    return {
        deleteWorkshop: deleteMutation,
    }
}

