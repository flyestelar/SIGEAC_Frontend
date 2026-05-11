'use client';

import CreateAirworthinessDirectiveComplianceExecutionForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveComplianceExecutionForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
} from '@api/types';

interface CreateAirworthinessDirectiveComplianceExecutionDialogProps {
  directiveId: number;
  applicabilities: AirworthinessDirectiveApplicabilityResource[];
  control: AirworthinessDirectiveComplianceControlResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAirworthinessDirectiveComplianceExecutionDialog({
  directiveId,
  applicabilities,
  control,
  open,
  onOpenChange,
}: CreateAirworthinessDirectiveComplianceExecutionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar cumplimiento</DialogTitle>
          <DialogDescription>
            Registra la ejecución del control{control.description ? ` "${control.description}"` : ''} para la aeronave seleccionada.
          </DialogDescription>
        </DialogHeader>

        <CreateAirworthinessDirectiveComplianceExecutionForm
          directiveId={directiveId}
          applicabilities={applicabilities}
          control={control}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}