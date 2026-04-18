import axiosInstance from '@/lib/axios';
import { HardTimeComponentDetail } from '@/types';
import { useQuery } from '@tanstack/react-query';

type HardTimeComponentDetailResponse = HardTimeComponentDetail | { data: HardTimeComponentDetail };

export const hardTimeComponentDetailQueryKey = (componentId: number | null) => [
  'hard-time-component-detail',
  componentId,
];

export const useGetHardTimeComponentDetail = (componentId: number | null, aircraftId?: number | null) => {
  return useQuery<HardTimeComponentDetail>({
    queryKey: hardTimeComponentDetailQueryKey(componentId),
    queryFn: ({ signal }) =>
      axiosInstance
        .get<HardTimeComponentDetailResponse>(`/hard-time-components/${componentId}`, {
          signal,
          params: { aircraft_id: aircraftId ?? undefined },
        })
        .then((res) => ('data' in res.data ? res.data.data : res.data)),
    enabled: !!componentId,
  });
};
