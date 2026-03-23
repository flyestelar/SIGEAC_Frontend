import axiosInstance from '@/lib/axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface AircraftTypePayload {
  family: string
  series: string
  manufacturer_id: number
  iata_code?: string | null
  type_certificate?: string | null
}

type AircraftTypeCreatePayload = AircraftTypePayload
type AircraftTypeUpdatePayload = Partial<AircraftTypePayload>

export const useCreateAircraftType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ company, data }: { company?: string; data: AircraftTypeCreatePayload }) => {
      if (!company) {
        throw new Error('Falta la compañía')
      }
      await axiosInstance.post(`/${company}/aircraft-types`, data)
    },
    onSuccess: (_, variables) => {
      if (variables.company) {
        queryClient.invalidateQueries({ queryKey: ['aircraftTypes', variables.company] })
      }
      toast.success('Tipo de aeronave creado', {
        description: 'El tipo de aeronave se guardó con éxito.',
      })
    },
    onError: () => {
      toast.error('No se pudo crear el tipo de aeronave')
    },
  })
}

export const useUpdateAircraftType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      company,
      data,
    }: {
      id?: number
      company?: string
      data: AircraftTypeUpdatePayload
    }) => {
      if (!company || !id) {
        throw new Error('Faltan datos')
      }
      await axiosInstance.put(`/${company}/aircraft-types/${id}`, data)
    },
    onSuccess: (_, variables) => {
      if (variables.company) {
        queryClient.invalidateQueries({ queryKey: ['aircraftTypes', variables.company] })
      }
      toast.success('Tipo de aeronave actualizado', {
        description: 'Los cambios se guardaron correctamente.',
      })
    },
    onError: () => {
      toast.error('No se pudo actualizar el tipo de aeronave')
    },
  })
}

export const useDeleteAircraftType = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, company }: { id?: number; company?: string }) => {
      if (!company || !id) {
        throw new Error('Faltan datos')
      }
      await axiosInstance.delete(`/${company}/aircraft-types/${id}`)
    },
    onSuccess: (_, variables) => {
      if (variables.company) {
        queryClient.invalidateQueries({ queryKey: ['aircraftTypes', variables.company] })
      }
      toast.success('Tipo de aeronave eliminado', {
        description: 'El tipo de aeronave se eliminó correctamente.',
      })
    },
    onError: () => {
      toast.error('No se pudo eliminar el tipo de aeronave')
    },
  })
}