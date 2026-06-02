'use client';

import { usePathname } from 'next/navigation';
import { memo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NavGroup } from '@/lib/menu-list-2';
import { useSidebar } from '../ui/sidebar';
import MenuGroup from './MenuGroup';

export const Menu = memo(function Menu({ menuList }: { menuList: NavGroup[] }) {
  const { open: isOpen, isMobile } = useSidebar();

  const pathname = usePathname();

  const collapsed = isOpen === false;

  return (
    <TooltipProvider disableHoverableContent>
      <ScrollArea className="[&>div>div[style]]:!block">
        {menuList.map(({ groupLabel, menus }) => (
          <MenuGroup
            key={groupLabel ?? `group-${menus[0]?.href ?? 'unknown'}`}
            groupLabel={groupLabel}
            menus={menus}
            collapsed={collapsed}
            isOpen={isOpen}
            isMobile={isMobile}
            pathname={pathname}
          />
        ))}
      </ScrollArea>
    </TooltipProvider>
  );
});
