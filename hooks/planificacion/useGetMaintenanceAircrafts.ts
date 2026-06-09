import { aircraftIndex } from '@api/sdk.gen';
import { queryOptions, useQuery } from '@tanstack/react-query';

export const getMaintenanceAircraftsOptions = (company?: string) =>
  queryOptions({
    queryKey: ['aircrafts', company],
    queryFn: ({ signal }) =>
      aircraftIndex({ path: { company: company! }, signal, throwOnError: true }).then((res) => res.data),
    enabled: !!company,
  });

export const useGetMaintenanceAircrafts = (company?: string) => {
  return useQuery(getMaintenanceAircraftsOptions(company));
};
