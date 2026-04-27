'use client';

import { useCreateMaintenanceControl } from '@/actions/planificacion/control_mantenimiento/actions';
import { parseMaintenanceInterval } from '@/actions/planificacion/control_mantenimiento/excelProcessor';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import MaintenanceControlForm, { MaintenanceControlFormValues } from '../_components/MaintenanceControlForm';

export default function NewMaintenanceControlPage() {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();
  const createMaintenanceControl = useCreateMaintenanceControl();

  const handleSubmit = async (values: MaintenanceControlFormValues) => {
    if (!selectedCompany?.slug) return;

    try {
      const controlInterval = parseMaintenanceInterval(values.interval);

      // Create maintenance control with task card IDs
      await createMaintenanceControl.mutateAsync({
        body: {
          title: values.title,
          description: values.description || null,
          manual_reference: values.manual_reference || null,
          interval_fh: controlInterval.fh || null,
          interval_fc: controlInterval.fc || null,
          interval_days: controlInterval.days || null,
          aircraft_ids: values.aircraft_ids,
          task_cards: values.tasks,
        },
      });

      toast.success('Control de mantenimiento creado exitosamente');
      // Navigate back to the main page
      router.push(`/${selectedCompany.slug}/planificacion/control_mantenimiento`);
    } catch (error) {
      console.error('Error creating maintenance control:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el control de mantenimiento');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ContentLayout title="Nuevo Control de Mantenimiento">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nuevo Control de Mantenimiento</h1>
            <p className="text-muted-foreground">Crea un nuevo control de mantenimiento con sus tareas asociadas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Control</CardTitle>
            <CardDescription>
              Complete la información del control de mantenimiento. El intervalo se define una sola vez y se aplica a
              todas las tareas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceControlForm
              submitting={createMaintenanceControl.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
