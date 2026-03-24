import axiosInstance from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';

interface locationsByCompanyId {
  id: number;
  address: string;
  type: string;
  cod_iata: string;
  isMainBase: boolean;
}

const fetchUserLocationsByCompanyId = async (
  company_id: number,
  signal?: AbortSignal,
): Promise<locationsByCompanyId[]> => {
  const response = await axiosInstance.post(`/user-locations-by-company-id`, { company_id }, { signal });
  return response.data;
};

export const useGetUserLocationsByCompanyId = (companyId: number | undefined) => {
  return useQuery({
    queryKey: ['user-locations-by-company-id', companyId],
    queryFn: ({ signal }) => fetchUserLocationsByCompanyId(companyId!, signal),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
