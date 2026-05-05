import axiosInstance from "@/lib/axios";
import { SmsActivityResource } from "@/.gen/api/types.gen";
import { useQuery } from "@tanstack/react-query";

const fetchSMSActivities = async (company?: string): Promise<SmsActivityResource[]> => {
  const { data } = await axiosInstance.get(`/${company}/sms/activities`);
  return data;
};

export const useGetSMSActivities = (company?: string) => {
  return useQuery<SmsActivityResource[]>({
    queryKey: ["sms-activities"],
    queryFn: () => fetchSMSActivities(company),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!company,
  });
};
