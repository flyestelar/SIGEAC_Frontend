import DashboardLayout from '@/components/layout/DashboardLayout';
import RequireCompany from '@/components/misc/RequireCompany';
import { SidebarSectionsStoreProvider } from '@/stores/SidebarSectionsStore';

const RoutesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RequireCompany>
      <SidebarSectionsStoreProvider >
        <DashboardLayout>{children}</DashboardLayout>
      </SidebarSectionsStoreProvider>
    </RequireCompany>
  );
};

export default RoutesLayout;
