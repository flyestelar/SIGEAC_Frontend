import { getMaintenanceAircraftsOptions } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { userQueryOptions } from '@/lib/auth/queries';
import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import MaintenanceDashboardClient from './_components/maintenance-dashboard-client';

async function MaintenanceDashboardPage({ params }: PageProps<'/[company]/planificacion/control_mantenimiento'>) {
  const { company } = await params;
  const queryClient = getQueryClient();
  const user = await queryClient.ensureQueryData(userQueryOptions());

  if (user) {
    void queryClient.prefetchQuery(getMaintenanceAircraftsOptions(company));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MaintenanceDashboardClient company={company} />
    </HydrationBoundary>
  );
}

export default MaintenanceDashboardPage;
