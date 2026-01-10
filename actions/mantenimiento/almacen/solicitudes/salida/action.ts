import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface IDispatchRequestAction {
  aircraft_id?: string;
  third_party_id?: string;
  responsible_company?: string;
  request_number: string;
  justification?: string;
  submission_date: string;
  created_by: string;
  requested_by?: string; // its optional because it may not be required for certain dispatch types
  category: string;
  articles: {
    article_id: number;
    quantity?: number;
    serial?: string | null;
  }[];
  user_id: number;
}

export const useCreateDispatchRequest = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  const createMutation = useMutation({
    mutationKey: ['dispatch-request'],
    mutationFn: async ({ data, company }: { data: IDispatchRequestAction; company: string }) => {
      await axiosInstance.post(`/${company}/dispatch-order`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      queryClient.invalidateQueries({ queryKey: ['dispatched-articles'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] });
      (toast.success('¡Creado!', {
        description: `La solicitud ha sido creado correctamente.`,
      }),
        router.refresh());
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear la solicitud...',
      });
      console.log(error);
    },
  });
  return {
    createDispatchRequest: createMutation,
  };
};

export const useUpdateStatusDispatchRequest = () => {
  const queryClient = useQueryClient();
  const updateStatusMutation = useMutation({
    mutationKey: ['dispatch-request-approve'],
    mutationFn: async ({
      id,
      status,
      approved_by,
      delivered_by,
      company,
    }: {
      id: string | number;
      status: string;
      approved_by: string;
      delivered_by: string;
      company: string;
    }) => {
      await axiosInstance.put(`/${company}/update-status-dispatch/${id}`, {
        status: status,
        approved_by: approved_by,
        delivered_by: delivered_by,
      });
    },
    onSuccess: () => {
      (queryClient.invalidateQueries({ queryKey: ['dispatches-requests-in-process'] }),
        queryClient.invalidateQueries({ queryKey: ['dispatched-articles'] }),
        toast.success('¡Actualizado!', {
          description: '¡La solicitud ha sido actualizada!',
        }));
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear la solicitud...',
      });
      console.log(error);
    },
  });
  return {
    updateDispatchStatus: updateStatusMutation,
  };
};

export const useCancelDispatchRequest = () => {
  const { selectedCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const cancelDispatchRequestMutation = useMutation({
    mutationKey: ['dispatch-request-cancel'],
    mutationFn: async ({ id }: { id: string | number }) => {
      await axiosInstance.put(`/${selectedCompany?.slug}/cancel-dispatch-order/${id}`);
    },
    onSuccess: () => {
      (queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['dispatched-articles'] }),
        toast.success('¡Cancelada!', {
          description: '¡La solicitud ha sido cancelada!',
        }));
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear la solicitud...',
      });
      console.log(error);
    },
  });
  return {
    cancelDispatchRequest: cancelDispatchRequestMutation,
  };
};
