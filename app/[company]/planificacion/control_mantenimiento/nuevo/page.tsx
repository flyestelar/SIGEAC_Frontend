'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { useCreateMaintenanceControl } from '@/actions/planificacion/control_mantenimiento/actions';
import MaintenanceControlForm, { MaintenanceControlFormValues } from '../_components/MaintenanceControlForm';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { processExcelFile, TaskCardData } from '@/lib/excelProcessor';
import { toast } from 'sonner';
import { useCreateTaskCard } from '@/actions/planificacion/task_cards/actions';

export default function NewMaintenanceControlPage() {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();
  const createMaintenanceControl = useCreateMaintenanceControl();
  const createTaskCard = useCreateTaskCard();

  const handleSubmit = async (values: MaintenanceControlFormValues) => {
    if (!selectedCompany?.slug) return;

    try {
      // Process Excel file first
      let taskCardIds: number[] = [];

      if (values.excel_file && values.excel_file.length > 0) {
        const file = values.excel_file[0];
        const taskData = await processExcelFile(file);

        // Create task cards
        const taskCardPromises = taskData.map(task =>
          createTaskCard.mutateAsync({
            body: {
              description: task.description,
              old_task: task.old_task || null,
              new_task: task.new_task || null,
              interval_fh: task.interval_fh || null,
              interval_fc: task.interval_fc || null,
              interval_days: task.interval_days || null,
            },
          })
        );

        const taskCardResults = await Promise.all(taskCardPromises);
        taskCardIds = taskCardResults.map(result => result.data.id);
      }

      // Create maintenance control with task card IDs
      await createMaintenanceControl.mutateAsync({
        body: {
          title: values.title,
          description: values.description || null,
          manual_reference: values.manual_reference || null,
          aircraft_ids: values.aircraft_ids,
          task_card_ids: taskCardIds,
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Nuevo Control de Mantenimiento
            </h1>
            <p className="text-muted-foreground">
              Crea un nuevo control de mantenimiento con sus tareas asociadas
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Control</CardTitle>
            <CardDescription>
              Complete la información del control de mantenimiento. El archivo Excel debe contener las tareas asociadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaintenanceControlForm
              mode="create"
              submitting={createMaintenanceControl.isPending}
              onCancel={handleCancel}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        {/* Excel Structure Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Estructura del Archivo Excel</CardTitle>
            <CardDescription>
              El archivo Excel debe tener exactamente esta estructura para importar las tareas correctamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Ejemplo de cómo debe verse exactamente tu archivo Excel:</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border px-4 py-2 text-center font-semibold w-16">A</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold w-16">B</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold w-16">C</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold w-16">D</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold w-16">E</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold w-16">F</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border px-4 py-2 font-semibold bg-muted/30">Descripción</td>
                      <td className="border border-border px-4 py-2 font-semibold bg-muted/30">Tarea Anterior</td>
                      <td className="border border-border px-4 py-2 font-semibold bg-muted/30">Tarea Nueva</td>
                      <td className="border border-border px-4 py-2 font-semibold bg-muted/30">Intervalo FH</td>
                      <td className="border border-border px-4 py-2 font-semibold bg-muted/30">Intervalo FC</td>
                      <td className="border border-border px-4 py-2 font-semibold bg-muted/30">Intervalo Días</td>
                    </tr>
                    <tr className="bg-muted/10">
                      <td className="border border-border px-4 py-2">Inspeccionar sistema hidráulico</td>
                      <td className="border border-border px-4 py-2">H1-001</td>
                      <td className="border border-border px-4 py-2">H1-002</td>
                      <td className="border border-border px-4 py-2 text-center">500</td>
                      <td className="border border-border px-4 py-2 text-center">200</td>
                      <td className="border border-border px-4 py-2 text-center">90</td>
                    </tr>
                    <tr className="bg-muted/5">
                      <td className="border border-border px-4 py-2">Verificar funcionamiento de flaps</td>
                      <td className="border border-border px-4 py-2">F2-001</td>
                      <td className="border border-border px-4 py-2">F2-002</td>
                      <td className="border border-border px-4 py-2 text-center">300</td>
                      <td className="border border-border px-4 py-2 text-center"></td>
                      <td className="border border-border px-4 py-2 text-center">60</td>
                    </tr>
                    <tr className="bg-muted/10">
                      <td className="border border-border px-4 py-2">Inspección visual del motor</td>
                      <td className="border border-border px-4 py-2"></td>
                      <td className="border border-border px-4 py-2">M3-001</td>
                      <td className="border border-border px-4 py-2 text-center">400</td>
                      <td className="border border-border px-4 py-2 text-center">150</td>
                      <td className="border border-border px-4 py-2 text-center"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Notas importantes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• La primera fila contiene los encabezados (negrita en la tabla)</li>
                  <li>• Las filas siguientes contienen los datos de las tareas</li>
                  <li>• La columna A (Descripción) es obligatoria para cada tarea</li>
                  <li>• Al menos una columna de intervalo debe tener un valor (D, E o F)</li>
                  <li>• Las celdas vacías en columnas opcionales serán ignoradas</li>
                  <li>• El archivo debe estar en formato .xlsx o .xls</li>
                  <li>• La hoja debe llamarse &quot;Tareas&quot; (o será la primera hoja si no existe)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}