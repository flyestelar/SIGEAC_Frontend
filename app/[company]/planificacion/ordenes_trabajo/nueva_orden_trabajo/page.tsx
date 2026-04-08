import { ContentLayout } from '@/components/layout/ContentLayout';
import WorkOrderForm from './_components/WorkOrderForm';

export default function NewWorkOrderPage() {
  return (
    <ContentLayout title="Nueva Orden de Trabajo">
      <WorkOrderForm />
    </ContentLayout>
  );
}
