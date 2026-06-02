import axiosInstance from '@/lib/axios';
import { HardTimeInstallationRequestResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';

export const useGetInstallRequests = (status?: 'pending' | 'approved' | 'rejected') => {
  return useQuery<HardTimeInstallationRequestResource[]>({
    queryKey: ['hard-time-installation-requests', status],
    queryFn: ({ signal }) =>
      axiosInstance
        .get<{ data: HardTimeInstallationRequestResource[] }>('/install-requests', {
          signal,
          params: status ? { status } : undefined,
        })
        .then((res) => res.data.data),
  });
};
