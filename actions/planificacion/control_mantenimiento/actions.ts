import {
    maintenanceControlsIndexQueryKey,
    maintenanceControlsStoreMutation,
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