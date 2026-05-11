import { ChevronLeft, MenuIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';

export function SidebarToggle() {
  const sidebar = useSidebar();
  return (
    <div className="md:absolute md:top-[12px] md:-left-[16px] z-20">
      <Button onClick={() => sidebar.toggleSidebar()} className="rounded-md w-8 h-8" variant="outline" size="icon">
        {sidebar.isMobile ? (
          <MenuIcon
            className={cn(
              'h-4 w-4 transition-transform ease-in-out duration-700',
              sidebar.openMobile ? 'rotate-90' : 'rotate-0',
            )}
          />
        ) : (
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform ease-in-out duration-700',
              !sidebar.open ? 'rotate-180' : 'rotate-0',
            )}
          />
        )}
      </Button>
    </div>
  );
}
