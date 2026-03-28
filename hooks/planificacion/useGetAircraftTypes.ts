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
  });
};
