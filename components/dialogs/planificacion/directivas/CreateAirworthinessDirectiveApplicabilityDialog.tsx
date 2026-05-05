'use client';

import CreateAirworthinessDirectiveApplicabilityForm from '@/components/forms/mantenimiento/planificacion/directivas/CreateAirworthinessDirectiveApplicabilityForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AirworthinessDirectiveApplicabilityResource } from '@api/types';

export default function CreateAirworthinessDirectiveApplicabilityDialog({
  directiveId,
  existingAircraftIds,
  applicability,
  open,
  onOpenChange,
}: {
  directiveId: number;
  existingAircraftIds: number[];
  applicability?: AirworthinessDirectiveApplicabilityResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = Boolean(applicability);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar aplicabilidad' : 'Nueva aplicabilidad'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Ajusta la aeronave, aplicabilidad, motivo y AMOC de este registro.'
              : 'Registra si la directiva aplica o no a una aeronave específica, con motivo y AMOC cuando corresponda.'}
          </DialogDescription>
        </DialogHeader>

        <CreateAirworthinessDirectiveApplicabilityForm
          directiveId={directiveId}
          existingAircraftIds={existingAircraftIds}
          applicability={applicability}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}