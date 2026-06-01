'use client';

import { UserNav } from '@/components/layout/UserNav';
import { cn } from '@/lib/utils';
import CompanySelect from '../selects/CompanySelect';
import { SidebarToggle } from '../sidebar/SidebarToggle';
import { ThemeToggler } from './ThemeToggler';
import { useSidebar } from '../ui/sidebar';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  const sidebar = useSidebar();
  return (
    <header className="sticky top-0 z-30 px-3 pt-2 sm:px-4">
      <div
        className={cn(
          'relative mx-auto flex h-12 items-center gap-3 rounded-2xl px-3 sm:pr-4 sm:pl-2',
          'border border-border/50',
          'bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl',
          'before:ring-1 before:ring-inset before:ring-white/[0.06] dark:before:ring-white/[0.04]',
        )}
      >
        <SidebarToggle />

        <div className="mr-auto flex min-w-0 items-center gap-3">
          <span className="hidden h-4 w-px bg-border/60 md:block" />
          <div className="flex min-w-0 flex-col leading-none">
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80 md:block">
              SIGEAC
            </span>
            <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
          </div>
        </div>

        {!sidebar.isMobile && <CompanySelect />}

        <span className="ml-1 hidden h-5 w-px bg-border/60 md:block" />

        <div className="flex items-center gap-1.5">
          <ThemeToggler />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
