'use client';

import { MaintenanceControlResource } from '@api/types';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileCheck2, Loader2, SquarePen } from 'lucide-react';
import type { SelectedControlItem } from './WorkOrderCreator';

interface WorkOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedControls: {
    control: MaintenanceControlResource;
    item: SelectedControlItem;
  }[];
  errors: Record<number, string>;
  isSubmitting: boolean;
  onDescriptionChange: (controlId: number, description: string) => void;
  onConfirm: () => void;
}

const WorkOrderItemsDialog = ({
  open,
  onOpenChange,
  selectedControls,
  errors,
  isSubmitting,
  onDescriptionChange,
  onConfirm,
}: WorkOrderItemsDialogProps) => {
  const pendingCount = selectedControls.filter(({ item }) => !item.description.trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
              <SquarePen className="size-4 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Revision final de items</DialogTitle>
              <DialogDescription>
                Complete la descripcion operativa de cada bloque antes de emitir la orden de trabajo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between border-b bg-muted/20 px-6 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {selectedControls.length} item{selectedControls.length !== 1 ? 's' : ''}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] tabular-nums',
                pendingCount > 0
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
              )}
            >
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Cada descripcion define el item que se registrara en la WO.</p>
        </div>

        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-4">
            {selectedControls.map(({ control, item }) => {
              const hasError = !!errors[control.id];

              return (
                <div key={control.id} className="rounded-lg border bg-background">
                  <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{control.title}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {control.manual_reference ?? 'Sin referencia'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {item.taskCardIds.size} task card{item.taskCardIds.size !== 1 ? 's' : ''}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          hasError
                            ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
                        )}
                      >
                        {hasError ? 'Requerido' : 'Listo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 p-4">
                    <Label htmlFor={`wo-description-${control.id}`} className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Descripcion del item
                    </Label>
                    <Textarea
                      id={`wo-description-${control.id}`}
                      rows={3}
                      value={item.description}
                      onChange={(event) => onDescriptionChange(control.id, event.target.value)}
                      placeholder="Describa el alcance del item que se incluira en la orden de trabajo"
                      className={cn('bg-muted/20', hasError && 'border-destructive focus-visible:ring-destructive')}
                    />
                    {hasError ? (
                      <p className="text-xs text-destructive">{errors[control.id]}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Se registraran {item.taskCardIds.size} task card{item.taskCardIds.size !== 1 ? 's' : ''} dentro de este item.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={onConfirm}
            disabled={isSubmitting || selectedControls.length === 0}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
            {isSubmitting ? 'Creando...' : 'Confirmar y emitir WO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderItemsDialog;
