'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGetAircraftTypes } from '@/hooks/planificacion/useGetAircraftTypes';
import { cn } from '@/lib/utils';
import { AircraftResource } from '@api/types';
import { Check, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface BulkAircraftSelectDialogProps {
  companySlug?: string;
  aircraftOptions: AircraftResource[];
  currentSelection: number[];
  onBulkSelect: (aircraftIds: number[]) => void;
  children: React.ReactNode;
}

export const BulkAircraftSelectDialog = ({
  companySlug,
  aircraftOptions,
  currentSelection,
  onBulkSelect,
  children,
}: BulkAircraftSelectDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAircraftTypeId, setSelectedAircraftTypeId] = useState<number | null>(null);

  const { data: aircraftTypesData, isFetching: isAircraftTypesFetching } = useGetAircraftTypes(companySlug);
  const aircraftTypesOptions = useMemo(() => aircraftTypesData?.data ?? [], [aircraftTypesData]);

  const selectAllAircraftsOfType = () => {
    if (!selectedAircraftTypeId) return;

    const aircraftsOfType = aircraftOptions.filter((aircraft) => aircraft.aircraft_type?.id === selectedAircraftTypeId);
    const aircraftIdsOfType = aircraftsOfType.map((aircraft) => aircraft.id);
    const current = currentSelection ?? [];
    const newSelection = [...new Set([...current, ...aircraftIdsOfType])];
    onBulkSelect(newSelection);
    setIsOpen(false);
    setSelectedAircraftTypeId(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedAircraftTypeId(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Seleccionar por tipo de aeronave</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo de aeronave</label>
            <Command className="mt-2">
              <CommandInput placeholder="Buscar tipo de aeronave..." />
              <CommandList>
                {isAircraftTypesFetching && (
                  <CommandItem>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando tipos de aeronave...
                  </CommandItem>
                )}
                {aircraftTypesOptions.map((aircraftType) => (
                  <CommandItem
                    key={aircraftType.id}
                    onSelect={() => setSelectedAircraftTypeId(aircraftType.id)}
                    className={cn(selectedAircraftTypeId === aircraftType.id && 'bg-accent')}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border-2 ${selectedAircraftTypeId === aircraftType.id
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                          }`}
                      >
                        {selectedAircraftTypeId === aircraftType.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{aircraftType.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {aircraftType.manufacturer?.name ?? "-"} • {aircraftType.family}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
                {aircraftTypesOptions.length === 0 && !isAircraftTypesFetching && (
                  <CommandItem className="justify-center text-xs text-muted-foreground">
                    No hay tipos de aeronave disponibles
                  </CommandItem>
                )}
              </CommandList>
            </Command>
          </div>

          {selectedAircraftTypeId && (
            <div>
              <label className="text-sm font-medium">Aeronaves que se seleccionarán</label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {(() => {
                  const aircraftsOfType = aircraftOptions.filter(
                    (aircraft) => aircraft.aircraft_type?.id === selectedAircraftTypeId,
                  );
                  const alreadySelected = aircraftsOfType.filter((aircraft) => currentSelection?.includes(aircraft.id));
                  const newSelections = aircraftsOfType.filter((aircraft) => !currentSelection?.includes(aircraft.id));

                  return (
                    <>
                      {newSelections.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1">
                            Nuevas selecciones ({newSelections.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {newSelections.map((aircraft) => (
                              <Badge key={aircraft.id} variant="outline" className="text-xs">
                                {aircraft.acronym}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {alreadySelected.length > 0 && (
                        <div className={newSelections.length > 0 ? 'mt-3' : ''}>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Ya seleccionadas ({alreadySelected.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {alreadySelected.map((aircraft) => (
                              <Badge key={aircraft.id} variant="secondary" className="text-xs">
                                {aircraft.acronym}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {aircraftsOfType.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No hay aeronaves de este tipo disponibles
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              onClick={selectAllAircraftsOfType}
              disabled={
                !selectedAircraftTypeId ||
                aircraftOptions.filter(
                  (aircraft) =>
                    aircraft.aircraft_type?.id === selectedAircraftTypeId && !currentSelection?.includes(aircraft.id),
                ).length === 0
              }
            >
              Seleccionar todos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
