'use client';

import { UserNav } from '@/components/layout/UserNav';
import { Button } from '@/components/ui/button';
import { NavGroup } from '@/lib/menu-list-2';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useEffectEvent, useState } from 'react';
import { tinykeys } from 'tinykeys';
import CompanySelect from '../selects/CompanySelect';
import { SidebarToggle } from '../sidebar/SidebarToggle';
import { useSidebar } from '../ui/sidebar';
import { BreadcrumbNav } from './BreadcrumbNav';
import { CommandPalette } from './CommandPalette';
import { ThemeToggler } from './ThemeToggler';

interface NavbarProps {
  menuList: NavGroup[];
}

export function Navbar({ menuList }: NavbarProps) {
  const sidebar = useSidebar();
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);

  const toggleCommand = () => setCommandOpen((prev) => !prev);
  const toggleTheme = useEffectEvent(() => setTheme(theme === 'dark' ? 'light' : 'dark'));

  useEffect(
    () =>
      tinykeys(window, {
        '$mod+k': (event) => {
          event.preventDefault();
          toggleCommand();
        },
        '$mod+Alt+t': (event) => {
          event.preventDefault();
          toggleTheme();
        },
      }),
    [],
  );

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} menuList={menuList} />
      <header className="sticky top-0 z-30 px-3 pt-2 sm:px-4">
        <div
          className={cn(
            'relative mx-auto flex min-h-12 items-center gap-3 rounded-2xl px-3 sm:pr-4 sm:pl-2',
            'border border-border/50',
            'bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55',
            'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl',
            'before:ring-1 before:ring-inset before:ring-white/[0.06] dark:before:ring-white/[0.04]',
          )}
        >
          <SidebarToggle />

          <div className="mr-auto flex min-w-0 items-center gap-3">
            <span className="hidden h-4 w-px bg-border/60 md:block" />
            <BreadcrumbNav menuList={menuList} />
          </div>

          {!sidebar.isMobile && <CompanySelect />}

          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-lg border-border/50 text-xs text-muted-foreground md:inline-flex hover:bg-muted/40 "
            onClick={() => setCommandOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Buscar...</span>
            <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </Button>

          <span className="ml-1 hidden h-5 w-px bg-border/60 md:block" />

          <div className="flex items-center gap-1.5">
            <ThemeToggler />
            <UserNav />
          </div>
        </div>
      </header>
    </>
  );
}
