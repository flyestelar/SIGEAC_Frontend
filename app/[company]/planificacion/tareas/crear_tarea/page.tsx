import CreateTaskMasterTaskForm from '@/components/forms/mantenimiento/planificacion/CreateTaskMasterTask';
import { ContentLayout } from '@/components/layout/ContentLayout';

const CreateTaskMasterTask = () => {
  return (
    <ContentLayout title="Crear Tarea de Servicio">
      <CreateTaskMasterTaskForm />
    </ContentLayout>
  );
};

export default CreateTaskMasterTask;
