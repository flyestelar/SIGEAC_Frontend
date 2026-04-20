'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { HardTimeCategoryGroup, HardTimeComponentWithMetrics } from '@/types';
import { HardTimeCardView } from './hard-time-card-view';

interface HardTimeCategorySidebarProps {
  categoryGroups: HardTimeCategoryGroup[];
  averages: { average_daily_flight_hours?: number | null; average_daily_flight_cycles?: number | null } | null;
  onSelectComponent: (id: number) => void;
  onInstallComponent: (componentId: number) => void;
  onUninstallComponent: (componentId: number) => void;
}

type ComponentFamilyGroup = {
  name: string;
  components: HardTimeComponentWithMetrics[];
  mountedCount: number;
  vacantCount: number;
};

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
  const componentFamilies = useMemo<ComponentFamilyGroup[]>(() => {
    const source = selectedGroup?.components ?? [];
    const grouped = source.reduce<Record<string, HardTimeComponentWithMetrics[]>>((acc, component) => {
      const key = component.part_name.trim() || 'Sin nombre';
      if (!acc[key]) acc[key] = [];
      acc[key].push(component);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, components]) => ({
        name,
        components: [...components].sort((a, b) => a.position.localeCompare(b.position)),
        mountedCount: components.filter((component) => component.active_installation).length,
        vacantCount: components.filter((component) => !component.active_installation).length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedGroup]);

  const totalSlots = selectedGroup?.components.length ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2 rounded-xl border border-border/60 bg-background p-3">
        <div className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">ATA seleccionado</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedGroup.category.name}</p>
              <p className="text-xs text-muted-foreground">{selectedGroup.category.code}</p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {totalSlots}
            </Badge>
          </div>
        </div>
        {categoryGroups.map((group) => {
          const isActive = group.category.code === selectedCategoryCode;
          return (
            <button
              key={group.category.code}
              type="button"
              className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                isActive
                  ? 'border-sky-500/40 bg-sky-500/[0.08]'
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
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tablero por familia
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">{selectedGroup.category.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedGroup.category.code}</p>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                El panel agrupa por nombre de componente y debajo muestra cada slot o ubicación disponible dentro del ATA seleccionado.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {componentFamilies.map((family) => (
              <section key={family.name} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/15 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight text-foreground">{family.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {family.components.length} slot{family.components.length !== 1 && 's'} dentro de {selectedGroup.category.code}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {family.mountedCount} montado{family.mountedCount !== 1 && 's'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${family.vacantCount > 0 ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' : ''}`}
                    >
                      {family.vacantCount} vacío{family.vacantCount !== 1 && 's'}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <HardTimeCardView
                    components={family.components}
                    onSelectComponent={onSelectComponent}
                    averageDailyFH={averageDailyFH}
                    averageDailyFC={averageDailyFC}
                    onInstallComponent={onInstallComponent}
                    onUninstallComponent={onUninstallComponent}
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
