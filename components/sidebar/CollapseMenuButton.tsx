'use client';

import { Dot, LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarSectionsStore } from '@/stores/SidebarSectionsStore';
import { cn } from '@/lib/utils';
import { DropdownMenu as DropdownMenuBase } from 'radix-ui';
import { SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '../ui/sidebar';
import { LeafItem } from './LeafItem';
import { LinkStatusIndicator } from './LinkStatusIndicator';
import { memo } from 'react';

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  isSubmenuActive: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
  isMobile: boolean;
  storageKey: string;
}

export const CollapseMenuButton = memo(function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  isSubmenuActive,
  submenus,
  isOpen,
  isMobile,
  storageKey,
}: CollapseMenuButtonProps) {
  const isCollapsed = useSidebarSectionsStore((state) => state.sections[storageKey] ?? isSubmenuActive);
  const setSectionOpen = useSidebarSectionsStore((state) => state.setSectionOpen);

  const buttonClassName = cn('h-10', !isOpen && 'mx-auto');

  const button = (
    <LeafItem
      active={active || isSubmenuActive}
      collapsed={!isOpen && !isMobile}
      chevron
      label={label}
      Icon={Icon}
      open={isCollapsed}
    />
  );

  const handleOpenChange = (open: boolean) => {
    setSectionOpen(storageKey, open);
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <Collapsible open={isCollapsed} onOpenChange={handleOpenChange} className="w-full group/collapsible">
          <TooltipProvider disableHoverableContent delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <CollapsibleTrigger asChild>{button}</CollapsibleTrigger>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right" align="start" alignOffset={2}>
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
            {isOpen ? (
              <AnimatePresence initial={false}>
                {isCollapsed ? (
                  <CollapsibleContent forceMount asChild>
                    <motion.div
                      key="submenu-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <SidebarMenuSub className="gap-1 py-2">
                        {submenus.map(({ href, label, active: subMenuActive }, index) => {
                          return (
                            <SidebarCollapseMenuSubItem
                              key={index}
                              active={subMenuActive}
                              href={href}
                              label={label}
                              className={buttonClassName}
                            />
                          );
                        })}
                      </SidebarMenuSub>
                    </motion.div>
                  </CollapsibleContent>
                ) : null}
              </AnimatePresence>
            ) : (
              <DropdownMenuContent side="right" sideOffset={25} align="start">
                <DropdownMenuLabel className="max-w-[190px] truncate">{label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {submenus.map(({ href, label }, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <Link href={href}>
                      <p className="max-w-[180px] truncate">{label}</p>
                      <LinkStatusIndicator />
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuBase.Arrow className="fill-border" />
              </DropdownMenuContent>
            )}
          </TooltipProvider>
        </Collapsible>
      </DropdownMenu>
    </SidebarMenuItem>
  );
});

const SidebarCollapseMenuSubItem = memo(function SidebarCollapseMenuSubItem({
  href,
  label,
  active,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <SidebarMenuSubItem key={href}>
      <SidebarMenuSubButton isActive={active} className={className} asChild>
        <Link href={href}>
          <Dot size={18} />
          <span className={cn('max-w-[170px] truncate')}>{label}</span>
          <LinkStatusIndicator />
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
});
