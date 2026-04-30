'use client';

import CreateAirworthinessDirectiveComplianceExecutionForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveComplianceExecutionForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  AirworthinessDirectiveApplicabilityResource,
  AirworthinessDirectiveComplianceControlResource,
} from '@api/types';

interface CreateAirworthinessDirectiveComplianceExecutionDialogProps {
  directiveId: number;
  applicability: AirworthinessDirectiveApplicabilityResource;
  control: AirworthinessDirectiveComplianceControlResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAirworthinessDirectiveComplianceExecutionDialog({
  directiveId,
  applicability,
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
            Registra la ejecución del control para {applicability.aircraft?.acronym ?? `#${applicability.aircraft_id}`}.
          </DialogDescription>
        </DialogHeader>

        <CreateAirworthinessDirectiveComplianceExecutionForm
          directiveId={directiveId}
          applicability={applicability}
          control={control}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}