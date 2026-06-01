import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SmsStation {
  id: number;
  name: string;
  slug: string;
}

export const useGetSmsStations = (company?: string | null) => {
  return useQuery<SmsStation[]>({
    queryKey: ["sms-stations", company],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${company}/sms/stations`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!company,
  });
};

export const useCreateSmsStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, name }: { company: string; name: string }) => {
      const { data } = await axiosInstance.post(`/${company}/sms/stations`, { name });
      return data;
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-stations", company] });
      toast.success("Estación creada correctamente.");
    },
    onError: () => {
      toast.error("No se pudo crear la estación.");
    },
  });
};

export const useUpdateSmsStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, id, name }: { company: string; id: number; name: string }) => {
      const { data } = await axiosInstance.patch(`/${company}/sms/stations/${id}`, { name });
      return data;
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-stations", company] });
      toast.success("Estación actualizada correctamente.");
    },
    onError: () => {
      toast.error("No se pudo actualizar la estación.");
    },
  });
};

export const useDeleteSmsStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, id }: { company: string; id: number }) => {
      await axiosInstance.delete(`/${company}/sms/stations/${id}`);
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-stations", company] });
      toast.success("Estación eliminada correctamente.");
    },
    onError: () => {
      toast.error("No se pudo eliminar la estación.");
    },
  });
};
