import axiosInstance from '@/lib/axios';
import { AircraftType, PaginatedResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchAircraftTypes = async (
  company?: string,
  search?: string,
  signal?: AbortSignal,
): Promise<PaginatedResponse<AircraftType>> => {
  const params = search ? { search } : undefined;
  const response = await axiosInstance.get<PaginatedResponse<AircraftType>>(`/${company}/aircraft-types`, {
    params,
    signal,
  });
  return response.data;
};

export const useGetAircraftTypes = (company?: string, search?: string) => {
  return useQuery<PaginatedResponse<AircraftType>>({
    queryKey: ['aircraftTypes', company, search ?? null],
    queryFn: ({ signal }) => fetchAircraftTypes(company, search, signal),
    enabled: !!company,
  });
};
