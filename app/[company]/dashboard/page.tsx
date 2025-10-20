'use client';
import { ContentLayout } from '@/components/layout/ContentLayout';
import DashboardTabs from '@/components/misc/DashboardTabs';
import PlanificacionFlotaMock from '@/components/misc/PlanificationDashboardPage';
import { useCompanyStore } from '@/stores/CompanyStore';

const DashboardPage = () => {
  const { selectedCompany } = useCompanyStore();
  return (
    <ContentLayout title={`Dashboard - ${selectedCompany?.slug.toUpperCase()}`}>
      {/* <DashboardTabs /> */}
      <PlanificacionFlotaMock />
    </ContentLayout>
  );
};

export default DashboardPage;
