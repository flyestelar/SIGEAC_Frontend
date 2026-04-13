import axiosInstance from "@/lib/axios";
import { SafetyBulletinResource } from "@/.gen/api/types.gen";
import { useQuery } from "@tanstack/react-query";

const fetchSafetyBulletins = async (company?: string): Promise<SafetyBulletinResource[]> => {
  const { data } = await axiosInstance.get(`/${company}/sms/bulletin`);
  return data.data;
};

export const useGetSafetyBulletins = (company?: string) => {
  return useQuery<SafetyBulletinResource[]>({
    queryKey: ["safety-bulletins", company],
    queryFn: () => fetchSafetyBulletins(company),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!company,
  });
};
