'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';

function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout requireCompany>{children}</DashboardLayout>;
}

export default CompanyLayout;
