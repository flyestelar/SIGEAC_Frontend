'use client';

import CreateAirworthinessDirectiveComplianceControlForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveComplianceControlForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AirworthinessDirectiveComplianceControlResource } from '@api/types';

interface CreateAirworthinessDirectiveComplianceControlDialogProps {
  directiveId: number;
  control?: AirworthinessDirectiveComplianceControlResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAirworthinessDirectiveComplianceControlDialog({
  directiveId,
  control,
  open,
  onOpenChange,
}: CreateAirworthinessDirectiveComplianceControlDialogProps) {
  const isEditing = Boolean(control);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar control de cumplimiento' : 'Nuevo control de cumplimiento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Ajusta descripción, vencimientos y recurrencias del control activo.'
              : 'Configura la descripción, vencimientos iniciales y la recurrencia del control para esta directiva.'}
          </DialogDescription>
        </DialogHeader>

        <CreateAirworthinessDirectiveComplianceControlForm
          directiveId={directiveId}
          control={control}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}