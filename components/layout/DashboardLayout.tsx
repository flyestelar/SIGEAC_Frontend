'use client';

import { cn } from '@/lib/utils';
import { SidebarSectionsStoreProvider, useSidebarSectionsStore } from '@/stores/SidebarSectionsStore';
import { SidebarProvider } from '../ui/sidebar';
import Footer from './Footer';
import { AppSidebar } from './Sidebar';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarSectionsStore((state) => state.isOpen);
  const setSidebarOpen = useSidebarSectionsStore((state) => state.setSidebarOpen);

  return (
    <SidebarProvider className="isolate" open={isOpen} onOpenChange={setSidebarOpen}>
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

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarSectionsStoreProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarSectionsStoreProvider>
  );
}

export default DashboardLayout;
