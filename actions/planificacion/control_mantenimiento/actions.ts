import {
  maintenanceControlsIndexQueryKey,
  maintenanceControlsStoreMutation,
  maintenanceControlsUpdateMutation
} from '@api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateMaintenanceControl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...maintenanceControlsStoreMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceControlsIndexQueryKey(),
      });
      toast.success('Control de mantenimiento creado', {
        description: 'El control de mantenimiento se guardó con éxito.',
      });
    },
    onError: () => {
      toast.error('No se pudo crear el control de mantenimiento');
    },
  });
};

export const useUpdateMaintenanceControl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...maintenanceControlsUpdateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceControlsIndexQueryKey(),
      });
      toast.success('Control de mantenimiento actualizado', {
        description: 'Los cambios se guardaron con éxito.',
      });
    },
    onError: () => {
      toast.error('No se pudo actualizar el control de mantenimiento');
    },
  });
};