'use client';

import { ChevronRight, Ellipsis } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { CollapseMenuButton } from '@/components/sidebar/CollapseMenuButton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getMenuList } from '@/lib/menu-list';
import { cn } from '@/lib/utils';
import { useSidebarSectionsStore } from '@/stores/SidebarSectionsStore';
import { memo } from 'react';
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '../ui/sidebar';
import { LeafItem } from './LeafItem';

type MenuGroupProps = {
  groupLabel?: string;
  menus: ReturnType<typeof getMenuList>[number]['menus'];
  collapsed: boolean;
  isOpen: boolean | undefined;
  isMobile: boolean;
  pathname: string;
};

const GroupHeader = memo(function GroupHeader({
  label,
  collapsed,
  open,
}: {
  label?: string;
  collapsed: boolean;
  open?: boolean;
}) {
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
    <div className="flex items-center gap-2">
      <SidebarGroupLabel className="text-[10px] uppercase text-muted-foreground truncate">{label}</SidebarGroupLabel>
      <div className="h-px flex-1 bg-border" />
      <ChevronRight className={cn('ml-auto size-3 text-muted-foreground transition-transform', open && 'rotate-90')} />
    </div>
  );
});

function MenuGroup({ groupLabel, menus, collapsed, isOpen, isMobile, pathname }: MenuGroupProps) {
  const setSectionOpen = useSidebarSectionsStore((state) => state.setSectionOpen);
  const groupKey = groupLabel ?? `group-${menus[0]?.href ?? 'unknown'}`;
  const groupStorageKey = `group:${groupKey}`;
  const isSidebarCollapsed = collapsed && isOpen !== undefined && !isMobile;
  const hasActiveItem = menus.some(({ href, submenus }) => {
    if (submenus.length > 0) {
      return (!!href && pathname.startsWith(href)) || submenus.some((submenu) => pathname === submenu.href);
    }

    return pathname === href;
  });
  const isGroupOpen = useSidebarSectionsStore((state) => state.sections[groupStorageKey] ?? hasActiveItem);
  const isGroupExpanded = isSidebarCollapsed || isGroupOpen || !groupLabel;

  const handleOpenChange = (open: boolean) => {
    setSectionOpen(groupStorageKey, open);
  };

  return (
    <Collapsible open={isGroupExpanded} onOpenChange={handleOpenChange}>
      <SidebarGroup className="w-full" key={groupKey}>
        {groupLabel ? (
          <CollapsibleTrigger asChild disabled={isSidebarCollapsed}>
            <button className="w-full text-left" type="button">
              <GroupHeader label={groupLabel} collapsed={isSidebarCollapsed} open={isGroupExpanded} />
            </button>
          </CollapsibleTrigger>
        ) : null}
        {isSidebarCollapsed ? (
          <CollapsibleContent forceMount>
            <SidebarGroupContent>
              <SidebarMenu>
                {menus.map(({ href, label, icon: Icon, submenus }) => {
                  const hasSubmenus = submenus.length > 0;
                  const isActive = !!href && (hasSubmenus ? pathname.startsWith(href) : pathname === href);
                  const isSubmenuActive = submenus.some((submenu) => pathname === submenu.href);
                  return submenus.length === 0 ? (
                    <SidebarMenuItem key={`${label}-${href}`}>
                      <LeafItem
                        key={`${label}-${href}`}
                        href={href}
                        label={label}
                        Icon={Icon}
                        active={isActive}
                        collapsed={isSidebarCollapsed}
                      />
                    </SidebarMenuItem>
                  ) : (
                    <CollapseMenuButton
                      key={`${label}-${href}`}
                      icon={Icon}
                      label={label}
                      active={isActive}
                      submenus={submenus.map((s) => ({ ...s, active: pathname === s.href }))}
                      isOpen={isOpen}
                      isSubmenuActive={isSubmenuActive}
                      isMobile={isMobile}
                      storageKey={`submenu:${groupKey}:${href ?? label}`}
                    />
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        ) : (
          <AnimatePresence initial={false}>
            {isGroupExpanded ? (
              <CollapsibleContent forceMount asChild>
                <motion.div
                  key="group-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {menus.map(({ href, label, icon: Icon, submenus }) => {
                        const hasSubmenus = submenus.length > 0;
                        const isActive = !!href && (hasSubmenus ? pathname.startsWith(href) : pathname === href);
                        const isSubmenuActive = submenus.some((submenu) => pathname === submenu.href);
                        return submenus.length === 0 ? (
                          <SidebarMenuItem key={`${label}-${href}`}>
                            <LeafItem
                              key={`${label}-${href}`}
                              href={href}
                              label={label}
                              Icon={Icon}
                              active={isActive}
                              collapsed={isSidebarCollapsed}
                            />
                          </SidebarMenuItem>
                        ) : (
                          <CollapseMenuButton
                            key={`${label}-${href}`}
                            icon={Icon}
                            label={label}
                            active={isActive}
                            submenus={submenus.map((s) => ({ ...s, active: pathname === s.href }))}
                            isOpen={isOpen}
                            isSubmenuActive={isSubmenuActive}
                            isMobile={isMobile}
                            storageKey={`submenu:${groupKey}:${href ?? label}`}
                          />
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </motion.div>
              </CollapsibleContent>
            ) : null}
          </AnimatePresence>
        )}
      </SidebarGroup>
    </Collapsible>
  );
}

export default memo(MenuGroup);
