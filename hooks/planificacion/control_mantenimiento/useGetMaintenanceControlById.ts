import { maintenanceControlsShowOptions } from '@api/queries';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export function useGetMaintenanceControlById({ id, aircraftId }: { id: string | number; aircraftId?: number }) {
  return useQuery({
    ...maintenanceControlsShowOptions({ path: { id: Number(id) }, query: { aircraft_id: aircraftId } }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}
