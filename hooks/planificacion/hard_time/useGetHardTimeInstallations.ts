import axiosInstance from '@/lib/axios';
import { HardTimeInstallation } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeInstallations = (componentId: number | null) => {
  return useQuery<HardTimeInstallation[]>({
    queryKey: ['hard-time-installations', componentId],
    queryFn: ({ signal }) =>
      axiosInstance
        .get<HardTimeInstallation[]>(`/hard-time-components/${componentId}/installations`, { signal })
        .then((res) => ((res.data as { data?: HardTimeInstallation[] }).data ?? res.data)),
    enabled: !!componentId,
  });
};
