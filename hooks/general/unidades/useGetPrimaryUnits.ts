import axios from "@/lib/axios";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Unit } from "@/types";
import { useQuery } from "@tanstack/react-query";
const fetchUnits = async (company?: string): Promise<Unit[]> => {
  const { data } = await axios.get(`/${company}/unit`);
  return data;
};

export const useGetUnits = () => {
  const {selectedCompany} = useCompanyStore()
  return useQuery<Unit[]>({
    queryKey: ["units"],
    queryFn: () => fetchUnits(selectedCompany?.slug),
    enabled: !!selectedCompany,
  });
};
