import { aircraftComponentSlotIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeComponents = (aircraftId: number | null | undefined) => {
  return useQuery({
    ...aircraftComponentSlotIndexOptions({ query: { aircraft_id: aircraftId ?? undefined } }),
    enabled: !!aircraftId,
  });
};
