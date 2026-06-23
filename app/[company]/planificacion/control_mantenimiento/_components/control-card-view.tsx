'use client';

import { AircraftAverageMetric } from '@api/types';
import { useCompanySlug } from '@/stores/CompanyStore';
import { ControlCard } from './control-card';
import { ComputedControl } from './control-grid-shared';

interface ControlCardViewProps {
  controls: ComputedControl[];
  averages: AircraftAverageMetric | null;
  aircraftId: number | null;
}

export function ControlCardView({ controls, averages, aircraftId }: ControlCardViewProps) {
  const company = useCompanySlug();
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
      {controls.map((computed) => {
        const controlId = computed.control.id;
        const href = aircraftId
          ? `/${company}/planificacion/control_mantenimiento/${controlId}?aircraft_id=${aircraftId}`
          : `/${company}/planificacion/control_mantenimiento/${controlId}`;
        return <ControlCard key={controlId} computed={computed} href={href} averages={averages} />;
      })}
    </div>
  );
}
