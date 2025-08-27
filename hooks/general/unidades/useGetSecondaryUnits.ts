import axios from "@/lib/axios";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Convertion } from "@/types";
import { useQuery } from "@tanstack/react-query";

const fetchSecondaryUnits = async (company?: string): Promise<Convertion[]> => {
  const { data } = await axios.get(`/${company}/convertion`);
  return data;
};

export const useGetSecondaryUnits = () => {
  const { selectedCompany } = useCompanyStore();
  return useQuery<Convertion[]>({
    queryKey: ["secondary-units"],
    queryFn: () => fetchSecondaryUnits(selectedCompany?.slug),
    enabled: !!selectedCompany,
  });
};
