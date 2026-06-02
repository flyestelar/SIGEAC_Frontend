import DashboardLayout from '@/components/layout/DashboardLayout';

const RoutesLayout = ({ children }: { children: React.ReactNode }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default RoutesLayout;
