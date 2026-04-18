import { hardTimeComponentShow } from '@api/sdk.gen';
import { HardTimeComponentDetail } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const hardTimeComponentDetailQueryKey = (componentId: number | null) => [
  'hard-time-component-detail',
  componentId,
];

export const useGetHardTimeComponentDetail = (componentId: number | null, aircraftId?: number | null) => {
  return useQuery<HardTimeComponentDetail>({
    queryKey: hardTimeComponentDetailQueryKey(componentId),
    queryFn: async () =>
      hardTimeComponentShow({
        path: { id: componentId ?? 0 },
        query: { aircraft_id: aircraftId ?? undefined },
        throwOnError: true,
      }).then((res) => res.data.data as unknown as HardTimeComponentDetail),
    enabled: !!componentId,
  });
};
