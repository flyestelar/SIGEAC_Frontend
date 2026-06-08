import DashboardLayout from '@/components/layout/DashboardLayout';
import { userQueryOptions } from '@/lib/auth/queries';
import { getQueryClient } from '@/lib/query-client';
import { notificationUnreadCountOptions } from '@api/queries';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const user = await queryClient.ensureQueryData(userQueryOptions());

  if (user) {
    void queryClient.prefetchQuery(notificationUnreadCountOptions());
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardLayout requireCompany>{children}</DashboardLayout>
    </HydrationBoundary>
  );
}

export default CompanyLayout;
