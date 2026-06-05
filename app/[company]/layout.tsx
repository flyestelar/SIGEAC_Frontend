import DashboardLayout from '@/components/layout/DashboardLayout';
import RequireCompany from '@/components/misc/RequireCompany';
import { getQueryClient } from '@/lib/query-client';
import { notificationUnreadCountOptions } from '@api/queries';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const RoutesLayout = async ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(notificationUnreadCountOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RequireCompany>
        <DashboardLayout>{children}</DashboardLayout>
      </RequireCompany>
    </HydrationBoundary>
  );
};

export default RoutesLayout;
