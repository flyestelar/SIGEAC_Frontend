'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';

export type ImportStrategy = 'replace' | 'prepend' | 'append';

type ImportedTask = {
  description: string;
  old_task?: string;
  new_task?: string;
};

interface ImportTasksConfirmDialogProps {
  open: boolean;
  pendingImportedTasks: ImportedTask[];
  pendingFileName: string;
  onCancel: () => void;
  onConfirm: (strategy: ImportStrategy) => void;
}

const ImportTasksConfirmDialog = (props: ImportTasksConfirmDialogProps) => {
  const { open, pendingImportedTasks, pendingFileName, onCancel, onConfirm } = props;

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

  return (
    <>
      <div className="rounded-md border p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como importar</p>
        <RadioGroup
          value={importStrategy}
          onValueChange={(value) => setImportStrategy(value as ImportStrategy)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="replace" id="import-replace" />
            <Label htmlFor="import-replace">Reemplazar tareas actuales</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="prepend" id="import-prepend" />
            <Label htmlFor="import-prepend">Agregar al inicio</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="append" id="import-append" />
            <Label htmlFor="import-append">Agregar al final</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border bg-background">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 whitespace-nowrap">
            <tr>
              <th className="px-2 py-1 text-left">Old Task Card</th>
              <th className="px-2 py-1 text-left">Descripcion</th>
              <th className="px-2 py-1 text-left">New Task Card</th>
            </tr>
          </thead>
          <tbody>
            {pendingImportedTasks.map((task, index) => (
              <tr key={`preview-${index}`} className="border-t">
                <td className="px-2 py-1 whitespace-nowrap">{task.old_task || '-'}</td>
                <td className="px-2 py-1">{task.description}</td>
                <td className="px-2 py-1 whitespace-nowrap">{task.new_task || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => onConfirm(importStrategy)}>
          Confirmar importacion
        </Button>
      </DialogFooter>
    </>
  );
}
