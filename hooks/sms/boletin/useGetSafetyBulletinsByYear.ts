import axiosInstance from "@/lib/axios";
import { SafetyBulletinResource } from "@/.gen/api/types.gen";
import { useQuery } from "@tanstack/react-query";

const fetchSafetyBulletinsByYear = async ({
  company,
  year,
}: {
  company?: string;
  year: string;
}): Promise<SafetyBulletinResource[]> => {
  const { data } = await axiosInstance.get(`/${company}/sms/bulletins-by-year/${year}`);
  return data;
};

export const useGetSafetyBulletinsByYear = ({
  company,
  year,
}: {
  company?: string;
  year: string;
}) => {
  return useQuery<SafetyBulletinResource[]>({
    queryKey: ["safety-bulletins", company, year],
    queryFn: () => fetchSafetyBulletinsByYear({ company, year }),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!company && !!year,
  });
};
