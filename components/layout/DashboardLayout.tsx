'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getMenuList } from '@/lib/menu-list';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { SidebarSectionsStoreProvider, useSidebarSectionsStore } from '@/stores/SidebarSectionsStore';
import { useMemo } from 'react';
import { useRequireAuthRedirect } from '../misc/RequireAuthRedirect';
import RequireCompany from '../misc/RequireCompany';
import { SidebarProvider } from '../ui/sidebar';
import Footer from './Footer';
import { Navbar } from './Navbar';
import { AppSidebar } from './Sidebar';

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
        <main className='min-h-[calc(100vh_-_56px)] flex flex-col'>
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

function DashboardLayout({ children, requireCompany }: { children: React.ReactNode; requireCompany?: boolean }) {
  useRequireAuthRedirect();

  const content = (
    <SidebarSectionsStoreProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarSectionsStoreProvider>
  );

  if (requireCompany) {
    return <RequireCompany>{content}</RequireCompany>;
  }

  return content;
}

export default DashboardLayout;
