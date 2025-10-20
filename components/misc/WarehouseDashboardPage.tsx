import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TestChart from './TestChart';
import ReportesAlmacenMock from './ReportTabDashboard';

const DashboardTabs = () => {
  return (
    <Tabs defaultValue="overview" className="">
      <TabsList className="h-12">
        <TabsTrigger value="overview" className="text-base">
          Overview
        </TabsTrigger>
        <TabsTrigger value="reports" className="text-base">
          Reportes
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <TestChart />
      </TabsContent>
      <TabsContent value="reports">
        <ReportesAlmacenMock />
      </TabsContent>
    </Tabs>
  );
};

export default DashboardTabs;
