'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ellipsis, LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

import { CollapseMenuButton } from '@/components/sidebar/CollapseMenuButton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuList } from '@/lib/menu-list-2';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';

interface MenuProps {
  isOpen?: boolean;
}

function GroupHeader({ label, collapsed }: { label?: string; collapsed: boolean }) {
  if (!label) return <div className="h-3" />;

  if (collapsed) {
    return (
      <Tooltip delayDuration={80}>
        <TooltipTrigger asChild>
          <div
            className="mb-2 mt-4 flex h-8 w-full items-center justify-center rounded-lg text-muted-foreground/80"
            aria-label={label}
          >
            <Ellipsis className="h-5 w-5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-sm">{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <p className="mt-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground max-w-[248px] truncate">
      {label}
    </p>
  );
}

function LeafItem({
  href,
  label,
  Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  const content = (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      className={cn(
        'group w-full justify-start gap-3 h-10 mb-1 rounded-xl px-3 transition-colors',
        active && 'shadow-sm',
      )}
      asChild
    >
      <Link href={href} aria-current={active ? 'page' : undefined}>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
          )}
        >
          <Icon size={18} />
        </span>

        <span
          className={cn(
            'min-w-0 flex-1 text-sm font-medium transition-all duration-200',
            collapsed ? 'pointer-events-none w-0 -translate-x-2 opacity-0' : 'w-auto translate-x-0 opacity-100',
          )}
        >
          <span className="block max-w-[200px] truncate">{label}</span>
        </span>
      </Link>
    </Button>
  );

  if (!collapsed) return content;

  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-sm">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Menu({ isOpen }: MenuProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { selectedCompany } = useCompanyStore();

  const userRoles = useMemo(() => {
    return user?.roles?.map((r) => r.name) ?? [];
  }, [user?.roles]);

  // Dependencia estable aunque cambie el orden del array
  const rolesKey = useMemo(() => [...userRoles].sort().join('|'), [userRoles]);

  const menuList = useMemo(() => {
    return getMenuList(pathname, selectedCompany, userRoles);
  }, [pathname, selectedCompany, rolesKey]);

  // Tailwind no puede compilar min-h dinámico -> style
  const minHeight = useMemo(() => {
    return isOpen === undefined ? 'calc(100vh - 48px - 36px - 16px - 32px)' : 'calc(100vh - 32px - 40px - 32px)';
  }, [isOpen]);

  const collapsed = isOpen === false;

  return (
    <TooltipProvider disableHoverableContent>
      <ScrollArea className="[&>div>div[style]]:!block">
        <nav className="mt-6 h-full w-full" aria-label="Main navigation">
          <ul className="flex flex-col items-start space-y-1 px-2" style={{ minHeight }}>
            {menuList.map(({ groupLabel, menus }) => {
              const groupKey = groupLabel ?? `group-${menus[0]?.href ?? 'unknown'}`;

              return (
                <li className="w-full" key={groupKey}>
                  <GroupHeader label={groupLabel} collapsed={collapsed && isOpen !== undefined} />

                  {menus.map(({ href, label, icon: Icon, active, submenus }) =>
                    submenus.length === 0 ? (
                      <div className="w-full" key={href}>
                        <LeafItem
                          href={href}
                          label={label}
                          Icon={Icon}
                          active={active}
                          collapsed={collapsed && isOpen !== undefined}
                        />
                      </div>
                    ) : (
                      <div className="w-full" key={href}>
                        <CollapseMenuButton
                          icon={Icon}
                          label={label}
                          active={active}
                          submenus={submenus}
                          isOpen={isOpen}
                        />
                      </div>
                    ),
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </TooltipProvider>
  );
}
