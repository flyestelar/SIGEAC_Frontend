'use client';

import { ServiceFormValues } from '@/app/[company]/planificacion/servicios/crear/page';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ListChecks } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import MaintenanceServiceTasksSelectDialogContent from './MaintenanceServiceTasksSelectDialogContent';

const MaintenanceServiceTasksSection = () => {
  const form = useFormContext<ServiceFormValues>();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const selectedTasks = form.watch('tasks') || [];

  return (
    <FormField
      name="tasks"
      control={form.control}
      render={() => (
        <FormItem className="col-span-full border-t pt-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <FormLabel>Tareas Asociadas</FormLabel>
              <div className="text-xs text-muted-foreground">
                Selecciona tareas maestras para adjuntarlas al servicio.
              </div>
            </div>
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <ListChecks className="mr-2 h-4 w-4" /> Agregar / Ver Tareas ({selectedTasks.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar tareas referenciadas</DialogTitle>
                  <DialogDescription>
                    Busca en las tareas y añade las necesarias al servicio.
                  </DialogDescription>
                </DialogHeader>
                <MaintenanceServiceTasksSelectDialogContent />
                <DialogFooter>
                  <Button type="button" onClick={() => setTaskDialogOpen(false)}>
                    Listo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default MaintenanceServiceTasksSection;
