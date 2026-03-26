import axiosInstance from '@/lib/axios';
import { AircraftType, PaginatedResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchAircraftTypes = async (
  company?: string,
  search?: string,
  manufacturerId?: string,
  signal?: AbortSignal,
): Promise<PaginatedResponse<AircraftType>> => {
  const params = {
    ...(search ? { search } : {}),
    ...(manufacturerId ? { manufacturer_id: manufacturerId } : {}),
  };

  const response = await axiosInstance.get<PaginatedResponse<AircraftType>>(`/${company}/aircraft-types`, {
    params: Object.keys(params).length ? params : undefined,
    signal,
  });
  return response.data;
};

export const useGetAircraftTypes = (company?: string, search?: string, manufacturerId?: string) => {
  return useQuery<PaginatedResponse<AircraftType>>({
    queryKey: ['aircraftTypes', company, { search: search ?? null, manufacturerId: manufacturerId ?? null }],
    queryFn: ({ signal }) => fetchAircraftTypes(company, search, manufacturerId, signal),
    enabled: !!company,
  });
};
