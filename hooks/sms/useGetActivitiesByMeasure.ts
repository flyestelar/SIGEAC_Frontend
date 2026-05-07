import axiosInstance from "@/lib/axios";
import { SMSActivity } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface Params {
  company?: string;
  measure_id: string | number;
}

const fetchActivitiesByMeasure = async ({ company, measure_id }: Params): Promise<SMSActivity[]> => {
  const { data } = await axiosInstance.get(
    `/${company}/sms/mitigation-measures/${measure_id}/activities`
  );
  return data;
};

export const useGetActivitiesByMeasure = (params: Params) => {
  return useQuery<SMSActivity[]>({
    queryKey: ["activities-by-measure", params.measure_id],
    queryFn: () => fetchActivitiesByMeasure(params),
    staleTime: 1000 * 60 * 5,
    enabled: !!params.company && !!params.measure_id,
  });
};
