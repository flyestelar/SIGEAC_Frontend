'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { MaintenanceControl } from '@/types';
import type { SelectedControlItem } from './WorkOrderCreator';

interface WorkOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedControls: {
    control: MaintenanceControl;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Completar items de la WO</DialogTitle>
          <DialogDescription>
            Agregue una descripcion por cada control seleccionado antes de generar la orden de trabajo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-4">
            {selectedControls.map(({ control, item }) => (
              <div key={control.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{control.title}</p>
                    <p className="text-xs font-mono text-muted-foreground">{control.manual_reference}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    {item.taskCardIds.size} task card{item.taskCardIds.size !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor={`wo-description-${control.id}`}>Descripcion del item</Label>
                  <Textarea
                    id={`wo-description-${control.id}`}
                    value={item.description}
                    rows={2}
                    onChange={(event) => onDescriptionChange(control.id, event.target.value)}
                    placeholder="Describa el item de la orden de trabajo"
                    className={errors[control.id] ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors[control.id] && <p className="text-xs text-destructive">{errors[control.id]}</p>}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" className="gap-2" onClick={onConfirm} disabled={isSubmitting || selectedControls.length === 0}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSubmitting ? 'Creando…' : 'Confirmar y generar WO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderItemsDialog;
