'use client';

import CreateAirworthinessDirectiveForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CreateAirworthinessDirectiveDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva directiva</DialogTitle>
          <DialogDescription>
            Registra la directiva base. La aplicabilidad, controles y ejecuciones se configuran después en el detalle.
          </DialogDescription>
        </DialogHeader>

        <CreateAirworthinessDirectiveForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
