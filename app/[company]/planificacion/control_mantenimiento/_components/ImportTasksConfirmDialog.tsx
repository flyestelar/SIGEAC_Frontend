'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

export type ImportStrategy = 'replace' | 'prepend' | 'append';

const taskSchema = z.object({
  description: z.string().default(''),
  old_task: z.string().default(''),
  new_task: z.string().default(''),
  applicable: z.boolean().default(true),
});

const importTasksSchema = z.object({
  tasks: z.array(taskSchema),
});

type ImportTasksFormValues = z.infer<typeof importTasksSchema>;

export type ImportedTask = {
  description: string;
  old_task: string;
  new_task: string;
  applicable: boolean;
};

interface ImportTasksConfirmDialogProps {
  open: boolean;
  pendingImportedTasks: ImportedTask[];
  pendingFileName: string;
  onCancel: () => void;
  onConfirm: (strategy: ImportStrategy, editedTasks: ImportedTask[]) => void;
}

const ImportTasksConfirmDialog = (props: ImportTasksConfirmDialogProps) => {
  const { open, pendingImportedTasks, pendingFileName, onCancel } = props;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Previsualizacion de tareas importadas</DialogTitle>
          <DialogDescription>
            Se detectaron {pendingImportedTasks.length} tareas en {pendingFileName}. Confirme para aplicar la
            importacion.
          </DialogDescription>
        </DialogHeader>

        <ImportTasksConfirmDialogContent {...props} />
      </DialogContent>
    </Dialog>
  );
};

export default ImportTasksConfirmDialog;

function ImportTasksConfirmDialogContent(props: ImportTasksConfirmDialogProps) {
  const { pendingImportedTasks, onCancel, onConfirm } = props;
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('replace');
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<ImportTasksFormValues>({
    values: {
      tasks: pendingImportedTasks,
    },
  });

  const filteredIndices = pendingImportedTasks
    .map((task, index) => ({ task, index }))
    .filter(
      ({ task }) =>
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.old_task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.new_task.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .map(({ index }) => index);

  return (
    <>
      <div className="rounded-md border p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como importar</p>
        <ToggleGroup
          type="single"
          value={importStrategy}
          onValueChange={(value) => setImportStrategy(value as ImportStrategy)}
          className="justify-start"
          variant="outline"
        >
          <ToggleGroupItem value="replace" variant="outline">Reemplazar tareas actuales</ToggleGroupItem>
          <ToggleGroupItem value="prepend" variant="outline">Agregar al inicio</ToggleGroupItem>
          <ToggleGroupItem value="append" variant="outline">Agregar al final</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border bg-background">
        <div className="p-2 border-b">
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <table className="w-full text-xs">
          <thead className="bg-muted/50 whitespace-nowrap">
            <tr>
              <th className="px-2 py-1 text-left">Old Task Card</th>
              <th className="px-2 py-1 text-left">Descripcion</th>
              <th className="px-2 py-1 text-left">New Task Card</th>
              <th className="px-2 py-1 text-center">Aplica</th>
            </tr>
          </thead>
          <tbody>
            {filteredIndices.map((index) => {
              const task = pendingImportedTasks[index];
              return (
                <tr key={`preview-${index}`} className="border-t">
                  <td className="px-2 py-1 whitespace-nowrap">{task.old_task || '-'}</td>
                  <td className="px-2 py-1">{task.description}</td>
                  <td className="px-2 py-1 whitespace-nowrap">{task.new_task || '-'}</td>
                  <td className="px-2 py-1 text-center">
                    <Controller
                      control={form.control}
                      defaultValue={task.applicable}
                      name={`tasks.${index}.applicable`}
                      render={({ field }) => <Checkbox checked={field.value} onCheckedChange={field.onChange} />}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={form.handleSubmit((values) => onConfirm(importStrategy, values.tasks))}>
          Confirmar importacion
        </Button>
      </DialogFooter>
    </>
  );
}
