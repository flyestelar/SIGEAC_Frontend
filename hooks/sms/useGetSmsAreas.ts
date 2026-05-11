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
