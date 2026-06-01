'use client';

import EditAirworthinessDirectiveForm from '@/components/forms/mantenimiento/planificacion/directivas/EditAirworthinessDirectiveForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AirworthinessDirectiveResource } from '@api/types';

interface EditAirworthinessDirectiveDialogProps {
  directive: AirworthinessDirectiveResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditAirworthinessDirectiveDialog({
  directive,
  open,
  onOpenChange,
}: EditAirworthinessDirectiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar directiva</DialogTitle>
          <DialogDescription>
            Modifica los datos base de <span className="font-mono font-semibold">{directive.ad_number}</span>. El
            documento PDF se gestiona por separado.
          </DialogDescription>
        </DialogHeader>

        <EditAirworthinessDirectiveForm directive={directive} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
