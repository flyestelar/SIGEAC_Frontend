'use client';

import { useUpdateMaintenanceAircraft } from '@/actions/mantenimiento/planificacion/aeronaves/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAircraftTypes } from '@/hooks/planificacion/useGetAircraftTypes';
import { useEffect, useState } from 'react';

interface EditAircraftTypeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  acronym: string;
  companySlug: string;
  currentTypeId?: number;
  manufacturerId?: number;
}

export function EditAircraftTypeDialog(props: EditAircraftTypeDialogProps) {
  const { isOpen, onOpenChange, acronym, companySlug, currentTypeId, manufacturerId } = props;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tipo de aeronave</DialogTitle>
          <DialogDescription>Seleccione el tipo correcto para {acronym}.</DialogDescription>
        </DialogHeader>
        <EditAircraftTypeDialogContent {...props} />
      </DialogContent>
    </Dialog>
  );
}

function EditAircraftTypeDialogContent({
  companySlug,
  manufacturerId,
  currentTypeId,
  onOpenChange,
  isOpen,
  acronym,
}: EditAircraftTypeDialogProps) {
  const { data: aircraftTypesData } = useGetAircraftTypes(companySlug, undefined, manufacturerId);

  const [selectedAircraftTypeId, setSelectedAircraftTypeId] = useState<number | undefined>(currentTypeId);
  const { updateMaintenanceAircraft } = useUpdateMaintenanceAircraft();

  useEffect(() => {
    setSelectedAircraftTypeId(currentTypeId);
  }, [currentTypeId, isOpen]);

  const handleSaveAircraftType = async () => {
    if (!companySlug || !selectedAircraftTypeId) return;

    await updateMaintenanceAircraft.mutateAsync({
      acronym: acronym,
      company: companySlug,
      data: { aircraft_type_id: selectedAircraftTypeId },
    });

    onOpenChange(false);
  };
  return (
    <>
      <div className="space-y-2">
        <Select
          value={selectedAircraftTypeId ? String(selectedAircraftTypeId) : undefined}
          onValueChange={(value) => setSelectedAircraftTypeId(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione tipo" />
          </SelectTrigger>
          <SelectContent>
            {(aircraftTypesData?.data ?? []).map((type) => (
              <SelectItem key={type.id} value={String(type.id)}>
                {type.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleSaveAircraftType}
          disabled={
            !selectedAircraftTypeId || selectedAircraftTypeId === currentTypeId || updateMaintenanceAircraft.isPending
          }
        >
          {updateMaintenanceAircraft.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogFooter>
    </>
  );
}
