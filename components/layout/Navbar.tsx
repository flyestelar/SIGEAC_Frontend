'use client';

import { UserNav } from '@/components/layout/UserNav';
import CompanySelect from '../selects/CompanySelect';
import { SidebarToggle } from '../sidebar/SidebarToggle';
import { ThemeToggler } from './ThemeToggler';

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 flex h-14 items-center gap-4 sm:mx-8">
        <SidebarToggle />

        <div className="mr-auto flex min-w-0 items-center gap-3">
          <span className="hidden h-4 w-px bg-border md:block" />
          <div className="flex min-w-0 flex-col leading-none">
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:block">
              SIGEAC
            </span>
            <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
          </div>
        </div>

        <CompanySelect />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggler />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
