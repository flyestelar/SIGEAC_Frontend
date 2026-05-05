import axiosInstance from "@/lib/axios";
import { useCompanyStore } from "@/stores/CompanyStore";
import { SurveyResource } from "@/.gen/api/types.gen";
import { useQuery } from "@tanstack/react-query";

const fetchSurveys = async (
  company?: string,
  location_id?: string
): Promise<SurveyResource[]> => {
  const { data } = await axiosInstance.get(
    `/${company}/sms/${location_id}/survey`
  );
  return data.data;
};

export const useGetSurveys = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();

  return useQuery<SurveyResource[]>({
    queryKey: ["surveys", selectedCompany?.slug, selectedStation],
    queryFn: () => fetchSurveys(selectedCompany?.slug, selectedStation!),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!selectedCompany?.slug && !!selectedStation, 
  });
};
