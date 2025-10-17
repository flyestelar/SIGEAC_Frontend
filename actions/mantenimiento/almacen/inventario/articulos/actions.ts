import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Component, Consumable, Tool } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ArticleData {
  serial?: string;
  part_number: string;
  article_type: string;
  lot_number?: string;
  alternative_part_number?: string[];
  description?: string;
  zone?: string;
  last_calibration_date?: string;
  calibration_interval_days?: string;
  manufacturer_id?: number | string;
  condition_id?: number | string;
  batch_id: string;
  is_special?: boolean;
  caducate_date?: string;
  quantity?: string | number;
  fabrication_date?: string;
  calendar_date?: string;
  certificate_8130?: File | string;
  certificate_fabricant?: File | string;
  certificate_vendor?: File | string;
  image?: File | string;
}

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationKey: ['articles'],
    mutationFn: async ({ data, company }: { company: string; data: ArticleData }) => {
      await axiosInstance.post(`/${company}/article`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Creado!', {
        description: `El articulo ha sido creado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear el articulo...',
      });
      console.log(error);
    },
  });
  return {
    createArticle: createMutation,
  };
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationKey: ['articles'],
    mutationFn: async ({ id, data, company }: { id: number | string; company: string; data: ArticleData }) => {
      await axiosInstance.put(`/${company}/article/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Actualizado!', {
        description: `El articulo ha sido actualizado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar el articulo...',
      });
      console.log(error);
    },
  });
  return {
    updateArticle: updateMutation,
  };
};

export const useCreateDirectArticle = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationKey: ['articles'],
    mutationFn: async ({ data, company }: { company: string; data: Consumable | Component | Tool }) => {
      await axiosInstance.post(`/${company}/article`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Creado!', {
        description: `El articulo ha sido creado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo crear el articulo...',
      });
      console.log(error);
    },
  });
  return {
    createArticle: createMutation,
  };
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, company }: { id: number | string; company: string }) => {
      await axiosInstance.delete(`/${company}/article/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Eliminado!', {
        description: `¡El articulo ha sido eliminado correctamente!`,
      });
    },
    onError: (e) => {
      toast.error('Oops!', {
        description: '¡Hubo un error al eliminar el articulo!',
      });
    },
  });

  return {
    deleteArticle: deleteMutation,
  };
};

export const useUpdateArticleStatus = () => {
  const { selectedCompany } = useCompanyStore();

  const queryClient = useQueryClient();

  const updateArticleStatusMutation = useMutation({
    mutationKey: ['articles'],
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await axiosInstance.put(`/${selectedCompany?.slug}/update-status-items/${id}`, {
        status: status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-transit-articles'] });
      queryClient.invalidateQueries({ queryKey: ['in-reception-articles'] });
      queryClient.invalidateQueries({ queryKey: ['dispatched-articles'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-orders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Actualizado!', {
        description: `El articulo ha sido actualizado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar el articulo...',
      });
      console.log(error);
    },
  });
  return {
    updateArticleStatus: updateArticleStatusMutation,
  };
};

export const useConfirmIncomingArticle = () => {
  const queryClient = useQueryClient();

  const confirmIncomingArticleMutation = useMutation({
    mutationKey: ['articles'],
    mutationFn: async ({
      values,
      company,
    }: {
      values: {
        id?: number;
        serial?: string;
        part_number: string;
        lot_number?: string;
        alternative_part_number?: string[];
        description?: string;
        zone: string;
        manufacturer_id?: number | string;
        condition_id?: number | string;
        batch_id: string;
        is_special?: boolean;
        caducate_date?: string;
        quantity?: string | number;
        fabrication_date?: string;
        calendar_date?: string;
        certificate_8130?: File | string;
        certificate_fabricant?: File | string;
        certificate_vendor?: File | string;
        image?: File | string;
      };
      company: string;
    }) => {
      await axiosInstance.post(
        `/${company}/update-article-warehouse/${values.id}`,
        {
          ...values,
          status: 'InWarehouse',
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article'] });
      queryClient.invalidateQueries({ queryKey: ['in-transit-articles'] });
      queryClient.invalidateQueries({ queryKey: ['in-reception-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-articles'] });
      toast.success('¡Actualizado!', {
        description: `El articulo ha sido actualizado correctamente.`,
      });
    },
    onError: (error) => {
      toast.error('Oops!', {
        description: 'No se pudo actualizar el articulo...',
      });
      console.log(error);
    },
  });
  return {
    confirmIncoming: confirmIncomingArticleMutation,
  };
};
