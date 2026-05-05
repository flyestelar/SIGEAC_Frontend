'use client';

import CreateAirworthinessDirectiveComplianceControlForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveComplianceControlForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
} from '@api/types';

interface CreateAirworthinessDirectiveComplianceControlDialogProps {
  directiveId: number;
  applicability: AirworthinessDirectiveApplicabilityResource;
  control?: AirworthinessDirectiveComplianceControlResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAirworthinessDirectiveComplianceControlDialog({
  directiveId,
  applicability,
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
              ? 'Ajusta vencimientos y recurrencias del control activo para esta aeronave.'
              : 'Configura los vencimientos iniciales y la recurrencia del control para esta aeronave aplicable.'}
          </DialogDescription>
        </DialogHeader>

        <CreateAirworthinessDirectiveComplianceControlForm
          directiveId={directiveId}
          applicability={applicability}
          control={control}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}