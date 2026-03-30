import { aircraftTypesIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

export const useGetAircraftTypes = (company?: string, search?: string, manufacturerId?: number) => {
  return useQuery({
    ...aircraftTypesIndexOptions({
      query: {
        manufacturer_id: manufacturerId,
        search,
      },
    }),
    gcTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
