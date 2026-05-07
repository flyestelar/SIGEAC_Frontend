import axiosInstance from "@/lib/axios";
import { FollowUpControl } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface data {
  company?: string;
  measure_id: string;
}

const fetchMeasureFollowUpControl = async ({ company, measure_id }: data) => {
  const { data } = await axiosInstance.get(
    `/${company}/sms/follow-up-controls/by-measure/${measure_id}`
  );
  return data;
};

export const useGetMeasureFollowUpControl = (data: data) => {
  return useQuery<FollowUpControl[]>({
    queryKey: ["follow-up-controls", measure_id],
    queryFn: () => fetchMeasureFollowUpControl(data),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
