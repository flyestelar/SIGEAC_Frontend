import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Location } from '@/types';
import { useQuery } from '@tanstack/react-query';


const fetchLocations = async (company: string | undefined): Promise<Location[]> => {
  const { data } = await axiosInstance.get(`/${company}/locations`);
  return data;
};

export const useGetLocationsByCompany = () => {
  const { selectedCompany } = useCompanyStore();
  return useQuery<Location[]>({
    queryKey: ['location'],
    queryFn: () => fetchLocations(selectedCompany?.slug),
    staleTime: 1000 * 60 * 5,
    enabled: !!selectedCompany,
  });
};
