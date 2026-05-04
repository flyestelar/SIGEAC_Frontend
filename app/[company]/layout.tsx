'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import RequireCompany from '@/components/misc/RequireCompany';

const RoutesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RequireCompany>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireCompany>
  );
};

export default RoutesLayout;
