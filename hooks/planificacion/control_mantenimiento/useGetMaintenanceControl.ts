import axiosInstance from '@/lib/axios';
import { MaintenanceControl, PaginatedResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchMaintenanceControls = async ({
  signal,
}: { signal?: AbortSignal } = {}): Promise<
  PaginatedResponse<MaintenanceControl[]>
> => {
  const response = await axiosInstance.get<PaginatedResponse<MaintenanceControl[]>>(`/aircraft-types`, {
    signal,
  });
  return response.data;
};

export const useGetMaintenanceControl = () => {
  return useQuery<PaginatedResponse<MaintenanceControl[]>>({
    queryKey: ['aircraftTypes'],
    queryFn: ({ signal }) => fetchMaintenanceControls({ signal }),
  });
}
