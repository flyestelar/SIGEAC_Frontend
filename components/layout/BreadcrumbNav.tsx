'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment, useMemo } from 'react';
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
  if (patternParts.length > pathParts.length) return false;

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
  let best: {
    groupLabel: string | null;
    crumbs: { label: string; href?: string }[];
    score: number;
  } | null = null;

  for (const group of menuList) {
    for (const menu of group.menus) {
      const menuScore = menu.href.split('/').filter(Boolean).length;

      // Check if a submenu matches (higher score = more specific)
      for (const sub of menu.submenus) {
        if (pathMatches(sub.href, pathname)) {
          const subScore = sub.href.split('/').filter(Boolean).length;
          if (!best || subScore > best.score) {
            best = {
              groupLabel: group.groupLabel || null,
              crumbs: [{ label: menu.label, href: menu.href }, { label: sub.label }],
              score: subScore,
            };
          }
        }
      }

      // Check if the menu itself matches (and no submenu beat it)
      if (pathMatches(menu.href, pathname) && (!best || menuScore > best.score)) {
        best = {
          groupLabel: group.groupLabel || null,
          crumbs: [{ label: menu.label }],
          score: menuScore,
        };
      }
    }
  }

  return { groupLabel: best?.groupLabel ?? null, crumbs: best?.crumbs ?? [] };
}

export function BreadcrumbNav({ menuList }: BreadcrumbNavProps) {
  const pathname = usePathname();

  const { groupLabel, crumbs } = useMemo(() => getCrumbs(menuList, pathname), [menuList, pathname]);

  if (crumbs.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col leading-none py-1.5">
      {groupLabel && (
        <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80 md:block">
          {groupLabel}
        </span>
      )}
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-1 gap-y-0 sm:gap-y-0">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={i}>
                <BreadcrumbItem key={i}>
                  {!crumb.href ? (
                    <BreadcrumbPage className="text-xs">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className="text-xs" asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
