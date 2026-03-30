'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { useCreateMaintenanceControl } from '@/actions/planificacion/control_mantenimiento/actions';
import MaintenanceControlForm, { MaintenanceControlFormValues } from '../_components/MaintenanceControlForm';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseMaintenanceInterval } from '@/lib/excelProcessor';
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
      const controlInterval = parseMaintenanceInterval(values.interval);

      const taskCardPromises = values.tasks.map((task) =>
        createTaskCard.mutateAsync({
          body: {
            description: task.description.trim(),
            old_task: task.old_task?.trim() || null,
            new_task: task.new_task?.trim() || null,
            interval_fh: controlInterval.fh || null,
            interval_fc: controlInterval.fc || null,
            interval_days: controlInterval.days || null,
          },
        }),
      );

      const taskCardResults = await Promise.all(taskCardPromises);
      const taskCardIds = taskCardResults
        .map((result) => {
          const rawResult: unknown = result;

          if (typeof rawResult === 'string') {
            const parsedId = Number(rawResult);
            return Number.isFinite(parsedId) ? parsedId : null;
          }

          if (typeof rawResult === 'object' && rawResult !== null && 'data' in rawResult) {
            const data = (rawResult as { data?: unknown }).data;
            if (
              typeof data === 'object' &&
              data !== null &&
              'id' in data &&
              typeof (data as { id?: unknown }).id === 'number'
            ) {
              return (data as { id: number }).id;
            }
          }

          return null;
        })
        .filter((id): id is number => id !== null);

      if (taskCardIds.length !== values.tasks.length) {
        throw new Error('No se pudo obtener el identificador de todas las tareas creadas');
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
              Complete la información del control de mantenimiento. El intervalo se define una sola vez y se aplica a todas las tareas.
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
              El archivo Excel debe incluir solo las tareas. El intervalo se configura en este formulario, a nivel de control de mantenimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Ejemplo de cómo debe quedar el archivo Excel sin columna de intervalo:</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border px-4 py-2 text-center font-semibold">Old Task Card</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold">Descripción</th>
                      <th className="border border-border px-4 py-2 text-center font-semibold">New Task Card</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-muted/10">
                      <td className="border border-border px-4 py-2">H1-001</td>
                      <td className="border border-border px-4 py-2">Inspeccionar sistema hidráulico</td>
                      <td className="border border-border px-4 py-2">H1-002</td>
                    </tr>
                    <tr className="bg-muted/5">
                      <td className="border border-border px-4 py-2">F2-001</td>
                      <td className="border border-border px-4 py-2">Verificar funcionamiento de flaps</td>
                      <td className="border border-border px-4 py-2">F2-002</td>
                    </tr>
                    <tr className="bg-muted/10">
                      <td className="border border-border px-4 py-2"></td>
                      <td className="border border-border px-4 py-2">Inspección visual del motor</td>
                      <td className="border border-border px-4 py-2">M3-001</td>
                    </tr>
                    <tr className="bg-muted/5">
                      <td className="border border-border px-4 py-2">R3-010</td>
                      <td className="border border-border px-4 py-2">Prueba de instrumentos de navegación</td>
                      <td className="border border-border px-4 py-2">R3-011</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Notas importantes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• El intervalo ya no se registra en el Excel; se define en el formulario del control.</li>
                  <li>• Las filas representan tareas con sus datos base (old task, descripción y new task).</li>
                  <li>• El intervalo general se aplicará automáticamente a cada tarea importada.</li>
                  <li>• El archivo debe estar en formato .xlsx o .xls y la hoja llevar el nombre &quot;Tareas&quot; (o será la primera hoja si el nombre cambia).</li>
                  <li>• Las celdas vacías en los campos opcionales no detendrán la importación.</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/40 border border-border rounded-2xl p-4 space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Tabla referencial de intervalos</p>
                <p className="text-lg font-semibold text-white">
                  Elige el valor que mejor represente la frecuencia del servicio y copia exactamente el sufijo (FC para ciclos, FH para horas).
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-white/80 border-collapse">
                    <thead>
                      <tr className="border-b border-white/20 text-xs uppercase tracking-[0.15em]">
                        <th className="px-3 py-2">Servicio</th>
                        <th className="px-3 py-2 text-right">Intervalo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Tránsito (Transit Check)', value: 'Antes de cada vuelo' },
                        { label: '1A', value: '250 FH' },
                        { label: '2A', value: '500 FH' },
                        { label: '4A', value: '1.000 FH' },
                        { label: '8A', value: '2.000 FH' },
                        { label: '1C', value: '4.000 FH' },
                        { label: '2C', value: '8.000 FH' },
                        { label: '4C', value: '16.000 FH' },
                        { label: '6C', value: '24.000 FH' },
                        { label: '1D', value: '24.000 FH' },
                        { label: '2D', value: '24.000 FH' },
                        { label: 'SI', value: '24.000 FC' },
                        { label: '8C', value: '32.000 FH' },
                      ].map((row, index) => (
                        <tr key={row.label} className={index % 2 === 0 ? 'bg-white/5' : ''}>
                          <td className="px-3 py-2 font-semibold text-white">{row.label}</td>
                          <td className="px-3 py-2 font-mono text-right text-white">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-sm text-white/80">
                  <p className="leading-tight">
                    Los valores terminados en <span className="font-bold text-foreground">FC</span> son ciclos (Flight Cycles) y los terminados en <span className="font-bold text-foreground">FH</span> son horas de vuelo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
