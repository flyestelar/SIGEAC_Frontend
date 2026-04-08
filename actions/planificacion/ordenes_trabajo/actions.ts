import { workOrdersIndexQueryKey, workOrdersStoreMutation } from '@api/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...workOrdersStoreMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrdersIndexQueryKey({}) });
      toast.success('Orden de trabajo creada', {
        description: 'La orden se registro correctamente.',
      });
    },
    onError: () => {
      toast.error('No se pudo crear la orden de trabajo');
    },
  });
};
