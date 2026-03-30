'use client';

import { MultiAircraftSelect } from '@/components/forms/MultiAircraftSelect';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { parseMaintenanceInterval, processExcelFile } from '@/lib/excelProcessor';
import { useCompanyStore } from '@/stores/CompanyStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, CircleHelp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import ImportTasksConfirmDialog, { ImportStrategy } from './ImportTasksConfirmDialog';

const taskSchema = z.object({
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
  old_task: z.string().trim().optional().default(''),
  new_task: z.string().trim().optional().default(''),
});

const maintenanceControlSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(255, 'Máximo 255 caracteres'),
  description: z.string().trim().optional(),
  manual_reference: z.string().trim().optional(),
  interval: z
    .string()
    .trim()
    .min(1, 'El intervalo es obligatorio')
    .refine((value) => {
      const parsed = parseMaintenanceInterval(value);
      return parsed.fh !== undefined || parsed.fc !== undefined || parsed.days !== undefined;
    }, 'Ingrese un intervalo válido (ejemplo: 500 FH, 24 FC, 30 días o 1A)'),
  aircraft_ids: z.array(z.number()).min(1, 'Seleccione al menos una aeronave'),
  tasks: z.array(taskSchema).min(1, 'Debe agregar al menos una tarea'),
});

export type MaintenanceControlFormValues = z.infer<typeof maintenanceControlSchema>;

interface MaintenanceControlFormProps {
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: MaintenanceControlFormValues) => Promise<void>;
}

const MaintenanceControlForm = ({ submitting, onCancel, onSubmit }: MaintenanceControlFormProps) => {
  const { selectedCompany } = useCompanyStore();

  const form = useForm<MaintenanceControlFormValues>({
    resolver: zodResolver(maintenanceControlSchema),
    defaultValues: {
      title: '',
      description: '',
      manual_reference: '',
      interval: '',
      aircraft_ids: [],
      tasks: [],
    },
  });

  const { control } = form;

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: 'tasks',
  });

  const [newTask, setNewTask] = useState({
    description: '',
    old_task: '',
    new_task: '',
  });
  const [pendingImportedTasks, setPendingImportedTasks] = useState<MaintenanceControlFormValues['tasks']>([]);
  const [pendingFileName, setPendingFileName] = useState('');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const handleAddTask = () => {
    if (!newTask.description.trim()) {
      form.setError('tasks', {
        type: 'manual',
        message: 'La descripción es obligatoria para agregar una tarea',
      });
      return;
    }

    append({
      description: newTask.description.trim(),
      old_task: newTask.old_task.trim() || '',
      new_task: newTask.new_task.trim() || '',
    });

    form.clearErrors('tasks');
    setNewTask({ description: '', old_task: '', new_task: '' });
  };

  const handleMoveTaskUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveTaskDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  const handleRemoveAllTasks = () => {
    replace([]);
    form.clearErrors('tasks');
  };

  const handleNewTaskKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTask();
    }
  };

  const handleExcelSelection = async (file: File) => {
    try {
      const parsedTasks = await processExcelFile(file);
      setPendingImportedTasks(parsedTasks);
      setPendingFileName(file.name);
      setIsPreviewDialogOpen(true);
      form.clearErrors('tasks');
    } catch (error) {
      setPendingImportedTasks([]);
      setPendingFileName('');
      setIsPreviewDialogOpen(false);
      form.setError('tasks', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'No se pudo procesar el archivo Excel',
      });
    }
  };

  const confirmImport = (importStrategy: ImportStrategy) => {
    const currentTasks = form.getValues('tasks');

    if (importStrategy === 'replace') {
      replace(pendingImportedTasks);
    } else if (importStrategy === 'prepend') {
      replace([...pendingImportedTasks, ...currentTasks]);
    } else {
      replace([...currentTasks, ...pendingImportedTasks]);
    }

    setPendingImportedTasks([]);
    setPendingFileName('');
    setIsPreviewDialogOpen(false);
    form.clearErrors('tasks');
  };

  const cancelImport = () => {
    setPendingImportedTasks([]);
    setPendingFileName('');
    setIsPreviewDialogOpen(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: (acceptedFiles) => {
      handleExcelSelection(acceptedFiles[0]);
    },
    onDropRejected() {
      form.setError('tasks', {
        type: 'manual',
        message:
          'Archivo rechazado. Asegúrese de que sea un archivo Excel válido (.xlsx, .xls, .ods) y que no exceda el límite de tamaño permitido.',
      });
    },
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título del control de mantenimiento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del control de mantenimiento" className="min-h-[80px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="manual_reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia de Manual</FormLabel>
              <FormControl>
                <Input placeholder="Referencia del manual" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interval"
          render={({ field }) => {
            const preview = formatInterval(field.value);
            return (
              <FormItem>
                <FormLabel>Intervalo</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input placeholder="Ejemplo: 500 FH, 24 FC o 1A" {...field} />
                    <p className="text-xs text-muted-foreground">
                      Este intervalo se aplicará automáticamente a todas las tareas del control.
                    </p>
                    {preview && <p className="text-xs font-medium text-foreground">{preview}</p>}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="aircraft_ids"
          render={({ field }) => (
            <MultiAircraftSelect value={field.value} onChange={field.onChange} companySlug={selectedCompany?.slug} />
          )}
        />

        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>Tareas</FormLabel>
            {fields.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAllTasks}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover todas
              </Button>
            )}
          </div>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-md border border-dashed p-4 transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/30'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-sm font-medium">Importar tareas desde archivo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Arrastre y suelte su archivo aquí, o haga clic para seleccionar (.xlsx, .xls, .ods).
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="pointer-events-none">
                Seleccionar archivo
              </Button>
              <ExcelFormatHelpPopover />
            </div>
          </div>

          <ImportTasksConfirmDialog
            open={isPreviewDialogOpen}
            pendingImportedTasks={pendingImportedTasks}
            pendingFileName={pendingFileName}
            onCancel={cancelImport}
            onConfirm={confirmImport}
          />

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Descripción</th>
                  <th className="px-3 py-2 text-left font-medium">Old Task Card</th>
                  <th className="px-3 py-2 text-left font-medium">New Task Card</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                      No hay tareas cargadas. Puede importar desde Excel o agregarlas manualmente.
                    </td>
                  </tr>
                )}

                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t">
                    <td className="px-3 py-2 align-top">
                      <Input placeholder="Descripción de la tarea" {...form.register(`tasks.${index}.description`)} />
                      {form.formState.errors.tasks?.[index]?.description?.message && (
                        <p className="mt-1 text-xs text-destructive">
                          {form.formState.errors.tasks[index]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input placeholder="Old task card" {...form.register(`tasks.${index}.old_task`)} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input placeholder="New task card" {...form.register(`tasks.${index}.new_task`)} />
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveTaskUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveTaskDown(index)}
                          disabled={index === fields.length - 1}
                          className="h-6 w-6"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr className="border-t bg-muted/20">
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Descripción"
                      value={newTask.description}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                      onKeyDown={handleNewTaskKeyDown}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="Old Task Card"
                      value={newTask.old_task}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, old_task: e.target.value }))}
                      onKeyDown={handleNewTaskKeyDown}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      placeholder="New Task Card"
                      value={newTask.new_task}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, new_task: e.target.value }))}
                      onKeyDown={handleNewTaskKeyDown}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button type="button" variant="outline" onClick={handleAddTask} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {form.formState.errors.tasks?.message && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.tasks.message}</p>
          )}
        </FormItem>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Control'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaintenanceControlForm;

function formatInterval(intervalInput: string) {
  const raw = intervalInput?.trim();
  if (!raw) return null;

  const parsed = parseMaintenanceInterval(raw);
  const parts: string[] = [];

  if (parsed.fh !== undefined) parts.push(`FH: ${parsed.fh}`);
  if (parsed.fc !== undefined) parts.push(`FC: ${parsed.fc}`);
  if (parsed.days !== undefined) parts.push(`Días: ${parsed.days}`);

  return parts.length > 0 ? parts.join(' | ') : 'No se reconoce el intervalo';
}

function ExcelFormatHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Button type="button" variant="secondary" size="icon" className="gap-2">
          <CircleHelp className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] space-y-3">
        <div>
          <p className="text-sm font-semibold">Formato esperado</p>
          <p className="text-xs text-muted-foreground">
            El archivo debe incluir solo tareas con estas columnas: Old Task Card, Descripción y New Task Card.
          </p>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1 text-left">Old Task Card</th>
                <th className="px-2 py-1 text-left">Descripción</th>
                <th className="px-2 py-1 text-left">New Task Card</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-2 py-1">H1-001</td>
                <td className="px-2 py-1">Inspeccionar sistema hidráulico</td>
                <td className="px-2 py-1">H1-002</td>
              </tr>
              <tr className="border-t">
                <td className="px-2 py-1">F2-001</td>
                <td className="px-2 py-1">Verificar funcionamiento de flaps</td>
                <td className="px-2 py-1">F2-002</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          El intervalo se define en el formulario del control y se aplica automáticamente a todas las tareas importadas.
        </p>
      </PopoverContent>
    </Popover>
  );
}
