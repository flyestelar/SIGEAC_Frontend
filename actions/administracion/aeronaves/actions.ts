import axiosInstance from "@/lib/axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useCreateAircraft = () => {

    const queryAircraft = useQueryClient()
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await axiosInstance.post('/transmandu/aircrafts', data)
          },
        onSuccess: () => {
            queryAircraft.invalidateQueries({queryKey: ['aircrafts']})
            toast("¡Creado!", {
                description: `¡La aeronave se ha creado correctamente!`
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
      createAircraft: createMutation,
    }
}

export const useDeleteAircraft = () => {

  const queryAircraft = useQueryClient()

  const deleteMutation = useMutation({
      mutationFn: async (id: number | string) => {
          await axiosInstance.delete(`/transmandu/aircrafts/${id}`)
        },
      onSuccess: () => {

          queryAircraft.invalidateQueries({queryKey: ['aircrafts']})
          toast.success("¡Eliminado!", {
              description: `¡La aeronave ha sido eliminado correctamente!`
          })
        },
      onError: (e) => {
          toast.error("Oops!", {
            description: "¡Hubo un error al eliminar la aeronave!"
        })
        },
      }
  )

  return {
    deleteAircraft: deleteMutation,
  }
}

export const useUpdateAircraft = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await axiosInstance.put(`/transmandu/aircrafts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircrafts'] });
      toast("¡Actualizado!", {
        description: "¡La aeronave se ha actualizado correctamente!",
      });
    },
    onError: (error) => {
      toast.error("Oops!", {
        description: `Hubo un error al actualizar la aeronave: ${error}`,
      });
    },
  });

  return {
    updateAircraft: updateMutation,
  };
};

export const useCashMovementForAircraft = () => {
  const queryAircraft = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: { id: string; formData: any }) => { 
      await axiosInstance.post(`/transmandu/cash-movement-aircraft/${data.id}/expense`, data.formData);
    },
    onSuccess: () => {
      queryAircraft.invalidateQueries({
        queryKey: ["aircrafts"],
      });
      toast("¡Creado!", {
        description: `¡El movimiento del gasto se ha creado correctamente!`,
      });
    },
    onError: (error) => {
      toast("Hey", {
        description: `No se creo correctamente: ${error}`,
      });
    },
  });
  return {
    createCashMovementForAircraft: createMutation,
  };
};