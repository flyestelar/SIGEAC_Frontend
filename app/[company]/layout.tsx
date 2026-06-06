import DashboardLayout from '@/components/layout/DashboardLayout';
import { isAuthenticated } from '@/lib/auth/user';
import { getQueryClient } from '@/lib/query-client';
import { notificationUnreadCountOptions } from '@api/queries';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

async function RoutesLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  if (await isAuthenticated()) {
    void queryClient.prefetchQuery(notificationUnreadCountOptions());
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardLayout requireCompany>{children}</DashboardLayout>
    </HydrationBoundary>
  );
}

export default RoutesLayout;
