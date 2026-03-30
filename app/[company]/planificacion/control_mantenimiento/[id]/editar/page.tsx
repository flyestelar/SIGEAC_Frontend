'use client';

import { useUpdateMaintenanceControl } from '@/actions/planificacion/control_mantenimiento/actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseMaintenanceInterval } from '@/lib/excelProcessor';
import { useGetMaintenanceControlById } from '@/hooks/planificacion/control_mantenimiento/useGetMaintenanceControlById';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MaintenanceControlForm, { MaintenanceControlFormValues } from '../../_components/MaintenanceControlForm';

export default function EditMaintenanceControlPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { selectedCompany } = useCompanyStore();
  const controlId = params.id;

  const { data: control, isLoading, error } = useGetMaintenanceControlById(controlId);
  const updateMaintenanceControl = useUpdateMaintenanceControl();

  const handleSubmit = async (values: MaintenanceControlFormValues) => {
    if (!selectedCompany?.slug || !controlId) return;

    try {
      const controlInterval = parseMaintenanceInterval(values.interval);

      // Update maintenance control with task card IDs
      await updateMaintenanceControl.mutateAsync({
        path: { id: Number(controlId) },
        body: {
          title: values.title,
          description: values.description || '',
          manual_reference: values.manual_reference || '',
          interval_fh: controlInterval.fh || null,
          interval_fc: controlInterval.fc || null,
          interval_days: controlInterval.days || null,
          aircraft_ids: values.aircraft_ids,
          task_cards: values.tasks,
        },
      });

      toast.success('Control de mantenimiento actualizado exitosamente');
      // Navigate back to the main page
      router.push(`/${selectedCompany.slug}/planificacion/control_mantenimiento`);
    } catch (error) {
      console.error('Error updating maintenance control:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el control de mantenimiento');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <ContentLayout title="Editar Control de Mantenimiento">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (error || !control) {
    return (
      <ContentLayout title="Editar Control de Mantenimiento">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Error</h1>
              <p className="text-muted-foreground">
                No se pudo cargar el control de mantenimiento. {error?.message || 'Control no encontrado'}
              </p>
            </div>
          </div>
        </div>
      </ContentLayout>
    );
  }

  // Transform the control data to match the form structure
  const formData: MaintenanceControlFormValues = {
    title: control.data.title,
    description: control.data.description || '',
    manual_reference: control.data.manual_reference || '',
    interval: formatIntervalForForm(control.data),
    aircraft_ids: control.data.aircrafts?.map((ac) => ac.id) || [],
    tasks:
      control.data.task_cards?.map((tc) => ({
        description: tc.description,
        old_task: tc.old_task || '',
        new_task: tc.new_task || '',
      })) || [],
  };

  return (
    <ContentLayout title="Editar Control de Mantenimiento">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Control de Mantenimiento</h1>
            <p className="text-muted-foreground">Modifica la información del control de mantenimiento</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Control</CardTitle>
            <CardDescription>
              Modifica la información del control de mantenimiento. El intervalo se define una sola vez y se aplica a
              todas las tareas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceControlForm
              submitting={updateMaintenanceControl.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              initialValues={formData}
            />
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}

function formatIntervalForForm(control: any): string {
  const parts: string[] = [];

  if (control.interval_fh) parts.push(`${control.interval_fh} FH`);
  if (control.interval_fc) parts.push(`${control.interval_fc} FC`);
  if (control.interval_days) parts.push(`${control.interval_days} días`);

  return parts.join(', ') || '';
}
