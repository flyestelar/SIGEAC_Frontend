import { aircraftComponentSlotShowOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeComponentDetail = (componentId: number | null | undefined) => {
  return useQuery({
    ...aircraftComponentSlotShowOptions({
      path: { id: componentId! },
    }),
    enabled: !!componentId,
    select: (response) => response.data,
  });
};
