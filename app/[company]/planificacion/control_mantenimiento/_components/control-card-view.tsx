'use client';

import { AircraftAverageMetric } from '@api/types';
import { ControlCard } from './control-card';
import { ComputedControl } from './control-grid-shared';

interface ControlCardViewProps {
  controls: ComputedControl[];
  onSelectControl: (id: number) => void;
  averages: AircraftAverageMetric | null;
}

export function ControlCardView({ controls, onSelectControl, averages }: ControlCardViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {controls.map((computed) => (
        <ControlCard
          key={computed.control.id}
          computed={computed}
          onSelect={() => onSelectControl(computed.control.id)}
          averages={averages}
        />
      ))}
    </div>
  );
}
