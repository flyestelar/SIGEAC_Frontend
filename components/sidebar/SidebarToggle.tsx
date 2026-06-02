import { MenuIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '../ui/sidebar';

export function SidebarToggle() {
  const sidebar = useSidebar();
  const DesktopIcon = sidebar.open ? PanelLeftClose : PanelLeftOpen;

  return (
    <Button
      onClick={() => sidebar.toggleSidebar()}
      className={cn(
        'shrink-0 h-9 w-9 rounded-xl border-border/60 bg-background/80 text-foreground/80 shadow-none transition-all duration-200',
        'hover:border-border hover:bg-muted/70 hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-0',
      )}
      variant="outline"
      size="icon"
    >
      {sidebar.isMobile ? (
        <motion.span
          animate={{ rotate: sidebar.openMobile ? 90 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          <MenuIcon className="h-4 w-4" />
        </motion.span>
      ) : (
        <motion.span
          animate={{ rotate: sidebar.open ? 0 : 180 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          <DesktopIcon className={cn('h-4 w-4', !sidebar.open && 'scale-95')} />
        </motion.span>
      )}
    </Button>
  );
}
