'use client';

import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/helpers/use-store';
import { useSidebarToggle } from '@/hooks/helpers/use-sidebar-toggle';
import { AppSidebar } from './Sidebar';
import Footer from './Footer';
import { SidebarProvider } from '../ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebar = useStore(useSidebarToggle, (state) => state);

  if (!sidebar) return null;

  return (
    <SidebarProvider
      className="isolate"
      open={sidebar.isOpen}
      onOpenChange={sidebar.setIsOpen}
      // style={
      //   {
      //     '--sidebar-width': '18rem',
      //     '--sidebar-width-icon': '90px',
      //   } as React.CSSProperties
      // }
    >
      <AppSidebar />
      <div className="flex-1 relative min-w-0">
        <main className={cn('min-h-[calc(100vh_-_56px)]')}>{children}</main>
        <footer>
          <Footer />
        </footer>
      </div>
    </SidebarProvider>
  );
}
