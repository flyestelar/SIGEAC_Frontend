import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { HardTimeCategoryGroup } from '@/types';
import { AircraftAverageMetric } from '@api/types';
import { HardTimeCardView } from './hard-time-card-view';

interface HardTimeCategoryAccordionProps {
  categoryGroups: HardTimeCategoryGroup[];
  averages: AircraftAverageMetric | null;
  onSelectComponent: (id: number) => void;
  onInstallComponent: (componentId: number) => void;
  onUninstallComponent: (componentId: number) => void;
}

export function HardTimeCategoryAccordion({
  categoryGroups,
  averages,
  onSelectComponent,
  onInstallComponent,
  onUninstallComponent,
}: HardTimeCategoryAccordionProps) {
  const averageDailyFH = averages?.average_daily_flight_hours ?? null;
  const averageDailyFC = averages?.average_daily_flight_cycles ?? null;

  return (
    <Accordion type="multiple" defaultValue={categoryGroups.map((group) => group.category.code)} className="space-y-3">
      {categoryGroups.map((group) => (
        <AccordionItem
          key={group.category.code}
          value={group.category.code}
          className="overflow-hidden rounded-xl border border-border/60 bg-card"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex w-full items-center justify-between gap-4 pr-2 text-left">
              <div>
                <p className="text-sm font-semibold">{group.category.name}</p>
                <p className="text-xs text-muted-foreground">{group.category.code}</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {group.components.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-border/50 px-4 py-4">
            <HardTimeCardView
              components={group.components}
              onSelectComponent={onSelectComponent}
              averageDailyFH={averageDailyFH}
              averageDailyFC={averageDailyFC}
              onInstallComponent={onInstallComponent}
              onUninstallComponent={onUninstallComponent}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
