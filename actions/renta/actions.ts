import axiosInstance from "@/lib/axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useCreateRenting = () => {

    const queryRenting = useQueryClient()
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await axiosInstance.post('/transmandu/rentings', data)
          },
        onSuccess: () => {
            queryRenting.invalidateQueries({queryKey: ['renting']})
            toast("¡Creado!", {
                description: `¡La renta se ha creado correctamente!`
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
      createRenting: createMutation,
    }
}

export const useDeleteRenting = () => {

  const queryRenting = useQueryClient()

  const deleteMutation = useMutation({
      mutationFn: async (id: number | string) => {
          await axiosInstance.delete(`/transmandu/rentings/${id}`)
        },
      onSuccess: () => {

          queryRenting.invalidateQueries({queryKey: ['renting']})
          toast.success("¡Eliminado!", {
              description: `¡La renta ha sido eliminado correctamente!`
          })
        },
      onError: (e) => {
          toast.error("Oops!", {
            description: "¡Hubo un error al eliminar la renta!"
        })
        },
      }
  )

  return {
    deleteRenting: deleteMutation,
  }
}