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
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
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
