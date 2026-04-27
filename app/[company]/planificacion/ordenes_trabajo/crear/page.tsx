import { ContentLayout } from '@/components/layout/ContentLayout';
import WorkOrderCreator from './_components/WorkOrderCreator';

export default function CrearOrdenTrabajoPage() {
  return (
    <ContentLayout title="Crear Orden de Trabajo">
      <WorkOrderCreator />
    </ContentLayout>
  );
}
