import { hardTimeComponentIndex } from '@api/sdk.gen';
import { HardTimeComponentsResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const hardTimeComponentsQueryKey = (aircraftId: number | null) => ['hard-time-components', aircraftId];

export const useGetHardTimeComponents = (aircraftId: number | null) => {
  return useQuery<HardTimeComponentsResponse>({
    queryKey: hardTimeComponentsQueryKey(aircraftId),
    queryFn: async () =>
      hardTimeComponentIndex({
        query: { aircraft_id: aircraftId ?? undefined },
        throwOnError: true,
      }).then((res) => res.data as unknown as HardTimeComponentsResponse),
    enabled: !!aircraftId,
  });
};
