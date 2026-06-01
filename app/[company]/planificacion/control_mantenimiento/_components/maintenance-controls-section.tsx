import { maintenanceControlsIndexOptions } from '@api/queries';
import { AircraftResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { ControlGrid } from './control-grid';
import { MaintenanceControlDetail } from './maintenance-control-detail';

interface MaintenanceControlsSectionProps {
  selectedControlId: number | null;
  onSelectControl: (id: number | null) => void;
  selectedAircraft: AircraftResource | null;
  selectedAircraftId: number | null;
}

function MaintenanceControlsSection({
  selectedControlId,
  onSelectControl,
  selectedAircraft,
  selectedAircraftId,
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
    return controls.filter((c) => c.aircrafts?.some((ac) => ac.id === selectedAircraft.id));
  }, [controls, selectedAircraft]);

  const selectedControl = useMemo(() => {
    return controlsForAircraft.find((c) => c.id === selectedControlId) ?? null;
  }, [controlsForAircraft, selectedControlId]);

  return (
    <div className="space-y-4">
      {isControlsLoading ? (
        <ControlGrid.Skeleton />
      ) : (
        <>
          {selectedControl ? (
            selectedAircraft && (
              <MaintenanceControlDetail
                control={selectedControl}
                aircraft={selectedAircraft}
                selectedAircraftId={selectedAircraftId}
                onBack={() => onSelectControl(null)}
              />
            )
          ) : (
            <ControlGrid
              controls={controlsForAircraft}
              onSelectControl={onSelectControl}
              averages={selectedAircraft?.last_average_metric ?? null}
            />
          )}
        </>
      )}
    </div>
  );
}

export default memo(MaintenanceControlsSection);
