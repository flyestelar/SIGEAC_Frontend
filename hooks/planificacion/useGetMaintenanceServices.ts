import axios from '@/lib/axios';
import { PaginatedResponse } from '@/types';
import { MaintenanceProgramService } from '@/types/planification';
import { useQuery } from '@tanstack/react-query';

const fetchServices = async (
  company?: string,
  signal?: AbortSignal,
): Promise<PaginatedResponse<MaintenanceProgramService>> => {
  const response = await axios.get<PaginatedResponse<MaintenanceProgramService>>(`/${company}/maintenance-service`, {
    signal,
  });
  return response.data;
};

export const useGetMaintenanceServices = (company?: string) => {
  return useQuery({
    queryKey: ['maintenance-services', company],
    queryFn: ({ signal }) => fetchServices(company, signal),
    enabled: !!company,
  });
};
