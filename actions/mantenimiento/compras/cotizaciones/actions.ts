import axiosInstance from '@/lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CreateQuoteData {
  justification: string;
  articles: {
    part_number: string;
    alt_part_number?: string;
    quantity: number;
    condition?: string;
    unit?: string;
    unit_price: string;
    vendor_id: number;
  }[];
  sub_total: number;
  total: number;
  vendor_id?: number;
  requisition_order_id: number;
  quote_date: Date;
  created_by: string;
  company: string;
  status?: string;
}

export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({ data, company }: { data: CreateQuoteData; company?: string }) => {
      await axiosInstance.post(`/${company}/quote`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote'], exact: false });
      toast.success('¡Creado!', {
        description: `La cotizacion ha sido creada correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear la cotizacion...',
      });
      console.log(error);
    },
  });
  return {
    createQuote: createMutation,
  };
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      company,
    }: {
      id: number;
      data: CreateQuoteData;
      company: string;
    }) => {
      await axiosInstance.put(`/${company}/quote/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote'], exact: false });
      toast.success('¡Actualizada!', {
        description: `La cotización ha sido actualizada correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar la cotización...',
      });
      console.log(error);
    },
  });
  return {
    updateQuote: updateMutation,
  };
};

export const useUpdateQuoteStatus = () => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      company,
    }: {
      id: number;
      company: string;
      data: {
        status: string;
        updated_by: string;
      };
    }) => {
      await axiosInstance.put(`/${company}/quote-order-update-status/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('¡Confirmada!', {
        description: `¡La cotizacion ha sido actualizada correctamente!`,
      });
    },
    onError: (e) => {
      toast.error('Oops!', {
        description: '¡Hubo un error al actualizar la cotización!',
      });
    },
  });

  return {
    updateStatusQuote: updateStatusMutation,
  };
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number; company: string }) => {
      await axiosInstance.delete(`/${company}/delete-quote/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('¡Eliminado!', {
        description: `¡La cotización ha sido eliminada correctamente!`,
      });
    },
    onError: (e) => {
      toast.error('Oops!', {
        description: '¡Hubo un error al eliminar la cotizacion!',
      });
    },
  });

  return {
    deleteQuote: deleteMutation,
  };
};
