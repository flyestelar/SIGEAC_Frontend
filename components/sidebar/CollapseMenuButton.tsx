'use client';

import { Dot, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
import { cn } from '@/lib/utils';
import { DropdownMenuArrow } from '@radix-ui/react-dropdown-menu';
import {
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '../ui/sidebar';
import { LeafItem } from './LeafItem';

type Submenu = {
  href: string;
  label: string;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
  isMobile: boolean;
}

export function CollapseMenuButton({ icon: Icon, label, active, submenus, isOpen, isMobile }: CollapseMenuButtonProps) {
  const pathname = usePathname();
  const isSubmenuActive = submenus.some((submenu) => pathname === submenu.href);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

  const buttonClassName = cn(!isOpen && 'mx-auto');

  const button = <LeafItem active={active || isSubmenuActive} collapsed={!isOpen && !isMobile} chevron label={label} Icon={Icon} />;
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <Collapsible open={isCollapsed} onOpenChange={setIsCollapsed} className="w-full group/collapsible">
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
              <CollapsibleContent>
                <SidebarMenuSub>
                  {submenus.map(({ href, label }, index) => {
                    const subMenuActive = pathname === href;
                    return (
                      <SidebarMenuSubItem key={index}>
                        <SidebarMenuSubButton isActive={subMenuActive} className={buttonClassName} asChild>
                          <Link href={href}>
                            <Dot size={18} />
                            <span className={cn('max-w-[170px] truncate')}>{label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            ) : (
              <DropdownMenuContent side="right" sideOffset={25} align="start">
                <DropdownMenuLabel className="max-w-[190px] truncate">{label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {submenus.map(({ href, label }, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <Link className="cursor-pointer" href={href}>
                      <p className="max-w-[180px] truncate">{label}</p>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuArrow className="fill-border" />
              </DropdownMenuContent>
            )}
          </TooltipProvider>
        </Collapsible>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
