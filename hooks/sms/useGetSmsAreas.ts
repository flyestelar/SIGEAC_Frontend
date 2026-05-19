import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SmsArea {
  id: number;
  name: string;
  slug: string;
}

export const useGetSmsAreas = (company?: string | null) => {
  return useQuery<SmsArea[]>({
    queryKey: ["sms-areas", company],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${company}/sms/areas`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!company,
  });
};

export const useCreateSmsArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, name }: { company: string; name: string }) => {
      const { data } = await axiosInstance.post(`/${company}/sms/areas`, { name });
      return data;
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-areas", company] });
      toast.success("Área creada correctamente.");
    },
    onError: () => {
      toast.error("No se pudo crear el área.");
    },
  });
};

export const useUpdateSmsArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, id, name }: { company: string; id: number; name: string }) => {
      const { data } = await axiosInstance.patch(`/${company}/sms/areas/${id}`, { name });
      return data;
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-areas", company] });
      toast.success("Área actualizada correctamente.");
    },
    onError: () => {
      toast.error("No se pudo actualizar el área.");
    },
  });
};

export const useDeleteSmsArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, id }: { company: string; id: number }) => {
      await axiosInstance.delete(`/${company}/sms/areas/${id}`);
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-areas", company] });
      toast.success("Área eliminada correctamente.");
    },
    onError: () => {
      toast.error("No se pudo eliminar el área.");
    },
  });
};
