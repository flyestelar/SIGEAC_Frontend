import { hardTimeComponentIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeComponents = (aircraftId: number | null | undefined) => {
  return useQuery({
    ...hardTimeComponentIndexOptions({ query: { aircraft_id: aircraftId ?? undefined } }),
    enabled: !!aircraftId,
  });
};
