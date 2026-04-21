'use client';

import { HardTimeComponentWithMetrics } from '@/types';
import { HardTimeCard } from './hard-time-card';

interface HardTimeCardViewProps {
  components: HardTimeComponentWithMetrics[];
  onSelectComponent: (id: number) => void;
  averageDailyFH?: number | null;
  averageDailyFC?: number | null;
  onInstallComponent?: (id: number) => void;
  onUninstallComponent?: (id: number) => void;
  onCreateInterval?: (id: number) => void;
}

export function HardTimeCardView({
  components,
  onSelectComponent,
  averageDailyFH,
  averageDailyFC,
  onInstallComponent,
  onUninstallComponent,
  onCreateInterval,
}: HardTimeCardViewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {components.map((component) => (
        <HardTimeCard
          key={component.id}
          component={component}
          onSelect={() => onSelectComponent(component.id)}
          averageDailyFH={averageDailyFH}
          averageDailyFC={averageDailyFC}
          onInstall={() => onInstallComponent?.(component.id)}
          onUninstall={() => onUninstallComponent?.(component.id)}
          onCreateInterval={() => onCreateInterval?.(component.id)}
        />
      ))}
    </div>
  );
}
