'use client';

import { processExcelFile, TaskCardData } from '@/actions/planificacion/control_mantenimiento/excelProcessor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, ChevronUp, CircleHelp, ListChecksIcon, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFieldArray, useFormContext } from 'react-hook-form';
import ImportTasksConfirmDialog, { ImportedTask, ImportStrategy } from './ImportTasksConfirmDialog';
import { MaintenanceControlFormValues } from './MaintenanceControlForm';

function MaintenanceControlTasksFormSection() {
  const form = useFormContext<MaintenanceControlFormValues>();

  const handleRemoveAllTasks = () => {
    replace([]);
    form.clearErrors('tasks');
    setSelectedTaskIds([]);
  };

  const handleToggleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((currentSelected) => {
      if (checked) {
        return currentSelected.includes(taskId) ? currentSelected : [...currentSelected, taskId];
      }

      return currentSelected.filter((id) => id !== taskId);
    });
  };

  const handleToggleAllVisibleTasks = (checked: boolean) => {
    setSelectedTaskIds((currentSelected) => {
      if (checked) {
        const nextSelected = new Set(currentSelected);
        visibleTaskIds.forEach((taskId) => nextSelected.add(taskId));
        return Array.from(nextSelected);
      }

      return currentSelected.filter((taskId) => !visibleTaskIds.includes(taskId));
    });
  };

  const handleRemoveSelectedTasks = () => {
    if (selectedTaskIds.length === 0) return;

    const selectedIndexes = fields
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => selectedTaskIds.includes(field.id))
      .map(({ index }) => index)
      .sort((left, right) => right - left);

    selectedIndexes.forEach((index) => remove(index));
    setSelectedTaskIds([]);
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

      const currentTitle = form.getValues('title');
      if (!currentTitle) {
        form.setValue('title', file.name.replace(/\.[^/.]+$/, ''));
      }

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

  const confirmImport = (importStrategy: ImportStrategy, editedTasks: ImportedTask[]) => {
    const currentTasks = form.getValues('tasks');

    if (importStrategy === 'replace') {
      replace(editedTasks);
    } else if (importStrategy === 'prepend') {
      replace([...editedTasks, ...currentTasks]);
    } else {
      replace([...currentTasks, ...editedTasks]);
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

  const { fields, append, remove, replace, move } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const filteredFields = fields
    .map((field, index) => ({ field, index }))
    .filter(
      ({ field }) =>
        field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.old_task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.new_task.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map(({ field, index }) => ({ field, index }));

  const visibleTaskIds = filteredFields.map(({ field }) => field.id);
  const allVisibleSelected =
    visibleTaskIds.length > 0 && visibleTaskIds.every((taskId) => selectedTaskIds.includes(taskId));
  const someVisibleSelected = visibleTaskIds.some((taskId) => selectedTaskIds.includes(taskId));

  useEffect(() => {
    setSelectedTaskIds((currentSelected) =>
      currentSelected.filter((taskId) => fields.some((field) => field.id === taskId)),
    );
  }, [fields]);

  const [newTask, setNewTask] = useState({
    description: '',
    old_task: '',
    new_task: '',
    applicable: true,
  });
  const [pendingImportedTasks, setPendingImportedTasks] = useState<TaskCardData[]>([]);
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
      applicable: newTask.applicable,
    });

    form.clearErrors('tasks');
    setNewTask({ description: '', old_task: '', new_task: '', applicable: true });
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

  return (
    <FormItem>
      <div className="flex items-center justify-between">
        <FormLabel className="flex items-center gap-2">
          <ListChecksIcon className="h-4 w-4" />
          Tareas
        </FormLabel>
        <div className="flex items-center gap-2">
          {selectedTaskIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveSelectedTasks}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar seleccionadas ({selectedTaskIds.length})
            </Button>
          )}
          {fields.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveAllTasks}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover todas
            </Button>
          )}
        </div>
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

      <div className="overflow-hidden rounded-md border">
        <div className="p-2 border-b">
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="w-10 px-3 py-2 text-center font-medium">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => handleToggleAllVisibleTasks(checked === true)}
                    aria-label="Seleccionar todas las tareas visibles"
                  />
                </th>
                <th className="px-3 py-2 text-center w-10 font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Descripción</th>
                <th className="px-3 py-2 text-left font-medium">Old Task Card</th>
                <th className="px-3 py-2 text-left font-medium">New Task Card</th>
                <th className="px-3 py-2 text-center font-medium">Aplica</th>
                <th className="px-3 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
                    No hay tareas cargadas. Puede importar desde Excel o agregarlas manualmente.
                  </td>
                </tr>
              )}

              {filteredFields.map(({ field, index }) => (
                <tr key={field.id} className="border-t">
                  <td className="px-3 py-2 text-center align-middle">
                    <Checkbox
                      checked={selectedTaskIds.includes(field.id)}
                      onCheckedChange={(checked) => handleToggleTaskSelection(field.id, checked === true)}
                      aria-label={`Seleccionar tarea ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-center text-sm text-muted-foreground align-middle">{index + 1}</td>
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
                  <td className="px-3 py-2 text-center align-middle">
                    <FormField
                      defaultValue={field.applicable}
                      control={form.control}
                      name={`tasks.${index}.applicable`}
                      render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
                    />
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              <tr className="border-t bg-muted/20">
                <td></td>
                <td className="px-3 py-2 text-center text-sm text-muted-foreground align-middle">-</td>
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
                <td className="px-3 py-2 text-center align-middle">
                  <Checkbox
                    checked={newTask.applicable}
                    onCheckedChange={(checked) => setNewTask((prev) => ({ ...prev, applicable: !!checked }))}
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
      </div>
      {form.formState.errors.tasks?.message && (
        <p className="text-sm font-medium text-destructive">{form.formState.errors.tasks.message}</p>
      )}
    </FormItem>
  );
}

export default MaintenanceControlTasksFormSection;

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
            El archivo debe incluir solo tareas con estas columnas: Old Task Card, Descripción y New Task Card
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
