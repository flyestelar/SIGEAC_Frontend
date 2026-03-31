import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CreateWorkOrderData {
  aircraft_id: number;
  items: {
    description: string;
    maintenance_control_id: number;
    maintenance_control_tasks_ids: number[];
  }[];
}

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ data, company, eventId }: { data: CreateWorkOrderData | Record<string, unknown>; company: string; eventId?: string }) => {
      const response = await axiosInstance.post(`/${company}/work-orders`, { ...data, eventId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'], exact: false });
      toast.success('¡Creado!', {
        description: 'La orden de trabajo ha sido registrada correctamente.',
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo registrar la orden de trabajo.',
      });
      console.error(error);
    },
  });

  return mutation;
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number | string; company: string }) => {
      await axiosInstance.delete(`/${company}/work-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['work-order'], exact: false });
      toast.success('¡Eliminado!', {
        description: 'La orden de trabajo ha sido eliminada correctamente.',
      });
    },
    onError: () => {
      toast.error('Oops!', {
        description: 'Hubo un error al eliminar la orden de trabajo.',
      });
    },
  });

  return { deleteWorkOrder: deleteMutation };
};
