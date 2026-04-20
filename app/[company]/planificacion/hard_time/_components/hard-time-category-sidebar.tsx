'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { HardTimeCategoryGroup } from '@/types';
import { HardTimeCardView } from './hard-time-card-view';

interface HardTimeCategorySidebarProps {
  categoryGroups: HardTimeCategoryGroup[];
  averages: { average_daily_flight_hours?: number | null; average_daily_flight_cycles?: number | null } | null;
  onSelectComponent: (id: number) => void;
  onInstallComponent: (componentId: number) => void;
  onUninstallComponent: (componentId: number) => void;
}

export function HardTimeCategorySidebar({
  categoryGroups,
  averages,
  onSelectComponent,
  onInstallComponent,
  onUninstallComponent,
}: HardTimeCategorySidebarProps) {
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>(
    categoryGroups[0]?.category.code ?? '',
  );

  useEffect(() => {
    if (!categoryGroups.length) return;
    setSelectedCategoryCode((current) =>
      categoryGroups.some((group) => group.category.code === current)
        ? current
        : categoryGroups[0].category.code,
    );
  }, [categoryGroups]);

  const selectedGroup = useMemo(
    () => categoryGroups.find((group) => group.category.code === selectedCategoryCode) ?? categoryGroups[0],
    [categoryGroups, selectedCategoryCode],
  );

  const averageDailyFH = averages?.average_daily_flight_hours ?? null;
  const averageDailyFC = averages?.average_daily_flight_cycles ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2 rounded-xl border border-border/60 bg-card p-3">
        <div className="rounded-xl border border-border/60 bg-background p-3 text-sm font-semibold text-foreground">
          Categorías
        </div>
        {categoryGroups.map((group) => {
          const isActive = group.category.code === selectedCategoryCode;
          return (
            <button
              key={group.category.code}
              type="button"
              className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-shadow ${
                isActive
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-background hover:border-border/80 hover:bg-muted/20'
              }`}
              onClick={() => setSelectedCategoryCode(group.category.code)}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{group.category.name}</p>
                <p className="text-xs text-muted-foreground">{group.category.code}</p>
              </div>
              <Badge variant="outline" className="self-start font-mono text-xs">
                {group.components.length}
              </Badge>
            </button>
          );
        })}
      </aside>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedGroup.category.name}</p>
              <p className="text-xs text-muted-foreground">{selectedGroup.category.code}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Cantidad: {selectedGroup.components.length}</span>
              <span>FH diaria: {averageDailyFH ?? '—'}</span>
              <span>FC diaria: {averageDailyFC ?? '—'}</span>
            </div>
          </div>

          <HardTimeCardView
            components={selectedGroup.components}
            onSelectComponent={onSelectComponent}
            averageDailyFH={averageDailyFH}
            averageDailyFC={averageDailyFC}
            onInstallComponent={onInstallComponent}
            onUninstallComponent={onUninstallComponent}
          />
        </div>
      </div>
    </div>
  );
}
