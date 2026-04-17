import axiosInstance from '@/lib/axios';
import { HardTimeComponentsResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const hardTimeComponentsQueryKey = (aircraftId: number | null) => ['hard-time-components', aircraftId];

export const useGetHardTimeComponents = (aircraftId: number | null) => {
  return useQuery<HardTimeComponentsResponse>({
    queryKey: hardTimeComponentsQueryKey(aircraftId),
    queryFn: ({ signal }) =>
      axiosInstance
        .get<HardTimeComponentsResponse>('/hard-time-components', {
          params: { aircraft_id: aircraftId },
          signal,
        })
        .then((res) => res.data),
    enabled: !!aircraftId,
  });
};
