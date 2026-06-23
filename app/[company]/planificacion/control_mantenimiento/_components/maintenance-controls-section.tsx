import { maintenanceControlsIndexOptions } from '@api/queries';
import { AircraftResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { ControlGrid } from './control-grid';

interface MaintenanceControlsSectionProps {
  selectedAircraft: AircraftResource | null;
  selectedAircraftId: number | null;
  aircraftId: number | null;
}

function MaintenanceControlsSection({
  selectedAircraft,
  selectedAircraftId,
  aircraftId,
}: MaintenanceControlsSectionProps) {
  const { data: controlsResponse, isLoading: isControlsLoading } = useQuery({
    ...maintenanceControlsIndexOptions({
      query: {
        aircraft_id: selectedAircraftId ?? undefined,
      },
    }),
    enabled: !!selectedAircraftId,
  });

  const controls = useMemo(() => controlsResponse?.data ?? [], [controlsResponse]);

  const controlsForAircraft = useMemo(() => {
    if (!selectedAircraft) return [];
    return controls.filter((c) => c.aircraft_ids?.includes(selectedAircraft.id));
  }, [controls, selectedAircraft]);

  return isControlsLoading ? (
    <ControlGrid.Skeleton />
  ) : (
    <ControlGrid
      controls={controlsForAircraft}
      averages={selectedAircraft?.last_average_metric ?? null}
      aircraftId={aircraftId}
    />
  );
}

export default memo(MaintenanceControlsSection);
