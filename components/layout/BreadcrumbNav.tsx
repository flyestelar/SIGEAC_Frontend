'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { NavGroup } from '@/lib/menu-list-2';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbNavProps {
  menuList: NavGroup[];
}

function pathMatches(pattern: string, pathname: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  // Dynamic segments: match any value
  if (patternParts.length !== pathParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const cp = pathParts[i];
    if (pp.startsWith('[') && pp.endsWith(']')) continue; // dynamic segment
    if (pp !== cp) return false;
  }

  return true;
}

function getCrumbs(
  menuList: NavGroup[],
  pathname: string,
): { groupLabel: string | null; crumbs: { label: string; href?: string }[] } {
  for (const group of menuList) {
    for (const menu of group.menus) {
      if (!pathMatches(menu.href, pathname) && !menu.submenus.some((s) => pathMatches(s.href, pathname))) continue;

      const trail: { label: string; href?: string }[] = [];

      // Menu label
      if (pathMatches(menu.href, pathname) && !menu.submenus.some((s) => pathMatches(s.href, pathname))) {
        trail.push({ label: menu.label });
      } else {
        trail.push({ label: menu.label, href: menu.href });

        // Find matching submenu
        for (const sub of menu.submenus) {
          if (pathMatches(sub.href, pathname)) {
            trail.push({ label: sub.label });
            break;
          }
        }
      }

      return { groupLabel: group.groupLabel || null, crumbs: trail };
    }
  }

  return { groupLabel: null, crumbs: [] };
}

export function BreadcrumbNav({ menuList }: BreadcrumbNavProps) {
  const pathname = usePathname();

  const { groupLabel, crumbs } = useMemo(() => getCrumbs(menuList, pathname), [menuList, pathname]);

  if (crumbs.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col leading-none">
      {groupLabel && (
        <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80 md:block">
          {groupLabel}
        </span>
      )}
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-1">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <BreadcrumbItem key={i}>
                {!crumb.href ? (
                  <BreadcrumbPage className="text-xs">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="text-xs" asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
                {!isLast && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
