import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AircraftTypePayload {
  manufacturer_id: number;
  model: string;
  series: string;
  icao_code: string;
  iata_code: string;
  type_certificate: string;
}

const invalidateAircraftTypes = (queryClient: ReturnType<typeof useQueryClient>, company: string) => {
  queryClient.invalidateQueries({ queryKey: ['aircraft-types', company] });
};

export const useCreateAircraftType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ company, data }: { company: string; data: AircraftTypePayload }) => {
      await axiosInstance.post(`/${company}/aircraft-types`, data);
    },
    onSuccess: (_, variables) => {
      invalidateAircraftTypes(queryClient, variables.company);
      toast.success('Tipo de aeronave creado', {
        description: 'Se registró correctamente el nuevo tipo de aeronave.',
      });
    },
    onError: () => {
      toast.error('No se pudo crear el tipo de aeronave.', {
        description: 'Verifica los datos e intenta nuevamente.',
      });
    },
  });
};

export const useUpdateAircraftType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ company, id, data }: { company: string; id: number; data: AircraftTypePayload }) => {
      await axiosInstance.put(`/${company}/aircraft-types/${id}`, data);
    },
    onSuccess: (_, variables) => {
      invalidateAircraftTypes(queryClient, variables.company);
      toast.success('Tipo de aeronave actualizado', {
        description: 'Los cambios se guardaron correctamente.',
      });
    },
    onError: () => {
      toast.error('No se pudo actualizar el tipo de aeronave.', {
        description: 'Verifica los datos e intenta nuevamente.',
      });
    },
  });
};

export const useDeleteAircraftType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ company, id }: { company: string; id: number }) => {
      await axiosInstance.delete(`/${company}/aircraft-types/${id}`);
    },
    onSuccess: (_, variables) => {
      invalidateAircraftTypes(queryClient, variables.company);
      toast.success('Tipo de aeronave eliminado', {
        description: 'El tipo de aeronave se eliminó correctamente.',
      });
    },
    onError: () => {
      toast.error('No se pudo eliminar el tipo de aeronave.', {
        description: 'Intenta nuevamente más tarde.',
      });
    },
  });
};
