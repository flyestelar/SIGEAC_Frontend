'use client';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import type { NavGroup } from '@/lib/menu-list';
import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';
import { Fragment, memo, useCallback, useDeferredValue, useMemo, useState } from 'react';

// ── Highlight helper ──────────────────────────────────────────────────
function highlightMatches(text: string, regions?: readonly (readonly [number, number])[]) {
  if (!regions || regions.length === 0) return text;

  const chunks: (string | React.ReactElement)[] = [];
  let lastIndex = 0;

  for (const [start, end] of regions) {
    if (start > lastIndex) {
      chunks.push(text.slice(lastIndex, start));
    }
    chunks.push(
      <mark key={start} className="rounded-sm bg-yellow-200 dark:bg-amber-800">
        {text.slice(start, end + 1)}
      </mark>,
    );
    lastIndex = end + 1;
  }

  if (lastIndex < text.length) {
    chunks.push(text.slice(lastIndex));
  }

  return chunks;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuList: NavGroup[];
}

interface FlattenedItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

export function CommandPalette({ open, onOpenChange, menuList }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter={false} className="[&>:first-child]:z-10">
        <CommandInput placeholder="Buscar páginas y acciones..." value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <ListContent menuList={menuList} onSelect={handleSelect} search={deferredSearch} />
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

const ListContent = memo(function ListContent({
  menuList,
  onSelect,
  search,
}: {
  menuList: NavGroup[];
  onSelect: (href: string) => void;
  search: string;
}) {
  const flattenedItems = useMemo<FlattenedItem[]>(() => {
    return menuList.flatMap((group) =>
      group.menus.flatMap((menu) => {
        if (menu.submenus.length > 0) {
          return menu.submenus.map((sub) => ({
            label: `${menu.label} › ${sub.label}`,
            href: sub.href,
            icon: menu.icon,
            group: group.groupLabel,
          }));
        }
        return {
          label: menu.label,
          href: menu.href,
          icon: menu.icon,
          group: group.groupLabel,
        };
      }),
    );
  }, [menuList]);

  const fuse = useMemo(
    () =>
      new Fuse(flattenedItems, {
        keys: ['label', 'group'],
        threshold: 0.35,
        distance: 100,
        shouldSort: true,
        includeMatches: true,
      }),
    [flattenedItems],
  );
  const results = useMemo(() => {
    if (!search.trim()) return null;
    return fuse.search(search.trim());
  }, [search, fuse]);

  return results
    ? !!results?.length && (
        <CommandGroup heading="Resultados">
          {results.map(({ item, matches }) => {
            const Icon = item.icon;
            const labelMatch = matches?.find((m) => m.key === 'label');
            const groupMatch = matches?.find((m) => m.key === 'group');
            return (
              <CommandItem key={item.href} onSelect={() => onSelect(item.href)}>
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                <div className="flex flex-col">
                  <span>{highlightMatches(item.label, labelMatch?.indices)}</span>
                  <span className="text-xs text-muted-foreground/60">
                    {highlightMatches(item.group, groupMatch?.indices)}
                  </span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      )
    : menuList.map((group, groupIndex) => {
        const groupItems = flattenedItems.filter((item) => item.group === group.groupLabel);
        if (groupItems.length === 0) return null;
        return (
          <Fragment key={groupIndex}>
            {groupIndex > 0 && <CommandSeparator />}
            <CommandGroup heading={group.groupLabel || 'Principal'}>
              {groupItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.href} onSelect={() => onSelect(item.href)}>
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Fragment>
        );
      });
});
