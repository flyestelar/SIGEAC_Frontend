'use client';

import { cn } from '@/lib/utils';
import { SidebarSectionsStoreProvider, useSidebarSectionsStore } from '@/stores/SidebarSectionsStore';
import { SidebarProvider } from '../ui/sidebar';
import Footer from './Footer';
import { AppSidebar } from './Sidebar';
import { useMemo } from 'react';
import { useCompanyStore } from '@/stores/CompanyStore';
import { getMenuList } from '@/lib/menu-list';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from './Navbar';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarSectionsStore((state) => state.isOpen);
  const setSidebarOpen = useSidebarSectionsStore((state) => state.setSidebarOpen);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const { user } = useAuth();

  const menuList = useMemo(() => {
    const userRoles = user?.roles?.map((r) => r.name) ?? [];
    const company = (selectedCompany && user?.companies.find((c) => c.id === selectedCompany?.id)) || selectedCompany;
    return getMenuList(company, userRoles);
  }, [selectedCompany, user]);

  return (
    <SidebarProvider className="isolate" open={isOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar menuList={menuList} />
      <div className="flex-1 relative min-w-0">
        <main className={cn('min-h-[calc(100vh_-_56px)]')}>
          <Navbar menuList={menuList} />
          {children}
        </main>
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
