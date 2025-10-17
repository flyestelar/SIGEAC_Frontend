import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type BatchType = {
  name: string;
  slug: string;
  unit_id: string;
  warehouse_id: number;
  description?: string;
  ata_code?: string;
  brand?: string;
  is_hazardous?: boolean;
  min_quantity?: number;
  zone?: string;
  category?: string;
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ data, company }: { data: BatchType; company: string }) => {
      await axiosInstance.post(`/${company}/batches`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('¡Creado!', {
        description: `El renglon ha sido creado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear el renglon...',
      });
      console.log(error);
    },
  });

  return {
    createBatch: createMutation,
  };
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number | string; company: string }) => {
      await axiosInstance.delete(`/${company}/batches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('¡Eliminado!', {
        description: `¡El renglon ha sido eliminado correctamente!`,
      });
    },
    onError: (e) => {
      toast.error('Oops!', {
        description: '¡Hubo un error al eliminar el renglon!',
      });
    },
  });

  return {
    deleteBatch: deleteMutation,
  };
};
