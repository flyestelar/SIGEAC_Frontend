import { aircraftIndex } from '@api/sdk.gen';
import { useQuery } from '@tanstack/react-query';


export const useGetMaintenanceAircrafts = (company?: string) => {
  return useQuery({
    queryKey: ['aircrafts', company],
    queryFn: ({ signal }) =>
      aircraftIndex({ path: { company: company! }, signal, throwOnError: true }).then((res) => res.data),
    enabled: !!company,
  });
};
