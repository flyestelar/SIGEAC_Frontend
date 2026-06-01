'use client';

import { cn } from '@/lib/utils';
import { useSidebarSectionsStore } from '@/stores/SidebarSectionsStore';
import { AppSidebar } from './Sidebar';
import Footer from './Footer';
import { SidebarProvider } from '../ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarSectionsStore((state) => state.isOpen);
  const setSidebarOpen = useSidebarSectionsStore((state) => state.setSidebarOpen);

  return (
    <SidebarProvider
      className="isolate"
      open={isOpen}
      onOpenChange={setSidebarOpen}
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
