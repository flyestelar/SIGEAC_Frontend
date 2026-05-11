'use client';

import { Ellipsis } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { CollapseMenuButton } from '@/components/sidebar/CollapseMenuButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuList } from '@/lib/menu-list-2';
import { useCompanyStore } from '@/stores/CompanyStore';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, useSidebar } from '../ui/sidebar';
import { LeafItem } from './LeafItem';

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

  return <SidebarGroupLabel className="uppercase text-muted-foreground truncate">{label}</SidebarGroupLabel>;
}

export function Menu() {
  const { open: isOpen, isMobile } = useSidebar();

  const { user } = useAuth();
  const pathname = usePathname();
  const { selectedCompany } = useCompanyStore();

  const userRoles = useMemo(() => {
    return user?.roles?.map((r) => r.name) ?? [];
  }, [user?.roles]);

  const menuList = useMemo(() => {
    const company = user?.companies.find((c) => c.id === selectedCompany?.id) || selectedCompany;
    return getMenuList(company, userRoles);
  }, [selectedCompany, user?.companies, userRoles]);

  const collapsed = isOpen === false;

  return (
    <TooltipProvider disableHoverableContent>
      <ScrollArea className="[&>div>div[style]]:!block">
        {menuList.map(({ groupLabel, menus }) => {
          const groupKey = groupLabel ?? `group-${menus[0]?.href ?? 'unknown'}`;

          return (
            <SidebarGroup className="w-full" key={groupKey}>
              <GroupHeader label={groupLabel} collapsed={collapsed && isOpen !== undefined && !isMobile} />
              <SidebarMenu>
                {menus.map(({ href, label, icon: Icon, submenus }) => {
                  const hasSubmenus = submenus.length > 0;
                  const isActive = !!href && (hasSubmenus ? pathname.startsWith(href) : pathname === href);
                  return submenus.length === 0 ? (
                    <SidebarMenuItem key={`${label}-${href}`}>
                      <LeafItem
                        key={`${label}-${href}`}
                        href={href}
                        label={label}
                        Icon={Icon}
                        active={isActive}
                        collapsed={collapsed && isOpen !== undefined && !isMobile}
                      />
                    </SidebarMenuItem>
                  ) : (
                    <CollapseMenuButton
                      key={`${label}-${href}`}
                      icon={Icon}
                      label={label}
                      active={isActive}
                      submenus={submenus}
                      isOpen={isOpen}
                      isMobile={isMobile}
                    />
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </ScrollArea>
    </TooltipProvider>
  );
}
