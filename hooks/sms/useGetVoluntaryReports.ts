import { VoluntaryReportResource } from "@/.gen/api/types.gen";
import axiosInstance from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const fetchVoluntaryReports = async (
  company?: string
): Promise<VoluntaryReportResource[]> => {
  const { data } = await axiosInstance.get(`/${company}/sms/voluntary-reports`);
  return data;
};

export const useGetVoluntaryReports = (company?: string) => {
  return useQuery<VoluntaryReportResource[]>({
    queryKey: ["voluntary-reports"],
    queryFn: () => fetchVoluntaryReports(company),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!company,
  });
};
