import { maintenanceControlsShowOptions, maintenanceControlsShowQueryKey } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

export const useGetMaintenanceControlById = (id: string | number) => {
  return useQuery({
    ...maintenanceControlsShowOptions({ path: { id: Number(id) } }),
    enabled: !!id,
  });
};
