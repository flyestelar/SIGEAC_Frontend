import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateEntry {
  article_id: number;
  new_quantity?: number;
  new_zone?: string;
}

interface UpdatePayload {
  updates: UpdateEntry[];
  company: string;
}

export const useUpdateArticleQuantityAndZone = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationKey: ['update-article-quantity-zone'],
    mutationFn: async ({ updates, company }: UpdatePayload) => {
      const { data } = await axiosInstance.put(`/${company}/articles/update-quantity-zone`, { updates });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Actualizado!', {
        description: 'Las cantidades y ubicaciones han sido actualizadas correctamente.',
      });
    },
    onError: () => {
      toast.error('Oops!', {
        description: 'No se pudieron actualizar las cantidades y ubicaciones...',
      });
    },
  });

  return {
    updateArticleQuantityAndZone: updateMutation,
  };
};
