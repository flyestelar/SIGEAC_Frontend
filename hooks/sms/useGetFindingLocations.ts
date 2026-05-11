import axiosInstance from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface FindingLocation {
  id: number;
  name: string;
  slug: string;
}

export const useGetFindingLocations = (company?: string | null) => {
  return useQuery<FindingLocation[]>({
    queryKey: ["sms-finding-locations", company],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/${company}/sms/finding-locations`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!company,
  });
};

export const useCreateFindingLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ company, name }: { company: string; name: string }) => {
      const { data } = await axiosInstance.post(`/${company}/sms/finding-locations`, { name });
      return data;
    },
    onSuccess: (_, { company }) => {
      queryClient.invalidateQueries({ queryKey: ["sms-finding-locations", company] });
      toast.success("Lugar de identificación creado correctamente.");
    },
    onError: () => {
      toast.error("No se pudo crear el lugar de identificación.");
    },
  });
};
