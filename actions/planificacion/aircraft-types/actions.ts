import axiosInstance from '@/lib/axios';
import {
  aircraftTypesDestroyMutation,
  aircraftTypesIndexQueryKey,
  aircraftTypesStoreMutation,
  aircraftTypesUpdateMutation,
} from '@api/queries';
import { StoreAircraftTypeRequest } from '@api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateAircraftType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...aircraftTypesStoreMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aircraftTypesIndexQueryKey(),
      });
      toast.success('Tipo de aeronave creado', {
        description: 'El tipo de aeronave se guardó con éxito.',
      });
    },
    onError: () => {
      toast.error('No se pudo crear el tipo de aeronave');
    },
  });
};

export const useUpdateAircraftType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...aircraftTypesUpdateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aircraftTypesIndexQueryKey(),
      });
      toast.success('Tipo de aeronave actualizado', {
        description: 'Los cambios se guardaron correctamente.',
      });
    },
    onError: () => {
      toast.error('No se pudo actualizar el tipo de aeronave');
    },
  });
};

export const useDeleteAircraftType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...aircraftTypesDestroyMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aircraftTypesIndexQueryKey() });
      toast.success('Tipo de aeronave eliminado', {
        description: 'El tipo de aeronave se eliminó correctamente.',
      });
    },
    onError: () => {
      toast.error('No se pudo eliminar el tipo de aeronave');
    },
  });
};
