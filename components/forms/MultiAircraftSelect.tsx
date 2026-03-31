'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useDebouncedInput } from '@/lib/useDebounce';
import { AircraftResource } from '@api/types';
import { Check, Loader2, Plane, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BulkAircraftSelectDialog } from './BulkAircraftSelectDialog';

interface MultiAircraftSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  companySlug?: string;
}

export const MultiAircraftSelect = ({ value, onChange, companySlug }: MultiAircraftSelectProps) => {
  const [aircraftSearch, setAircraftSearch] = useState('');
  const [aircraftCommandInput, setAircraftCommandInput] = useDebouncedInput('', setAircraftSearch);
  const [isAircraftPopoverOpen, setIsAircraftPopoverOpen] = useState(false);

  const { data: aircraftData, isFetching: isAircraftFetching } = useGetMaintenanceAircrafts(companySlug);

  const aircraftOptions = useMemo(() => (aircraftData ?? []) as any as AircraftResource[], [aircraftData]);

  const toggleAircraft = (aircraft: AircraftResource) => {
    const current = value ?? [];
    const exists = current.includes(aircraft.id);
    const next = exists ? current.filter((id: number) => id !== aircraft.id) : [...current, aircraft.id];
    onChange(next);
  };

  const selectedAircraftList = aircraftOptions.filter((aircraft) => value?.includes(aircraft.id));

  return (
    <FormItem className="space-y-3">
      <FormLabel className="flex items-center gap-2">
        <Plane className="h-4 w-4" />
        Aeronaves Aplicables
        <BulkAircraftSelectDialog
          companySlug={companySlug}
          aircraftOptions={aircraftOptions}
          currentSelection={value}
          onBulkSelect={onChange}
        >
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Search className="h-3 w-3" />
          </Button>
        </BulkAircraftSelectDialog>
      </FormLabel>
      <FormControl>
        <Popover open={isAircraftPopoverOpen} onOpenChange={setIsAircraftPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex w-full items-center justify-between">
              <span>
                {selectedAircraftList.length
                  ? `${selectedAircraftList.length} aeronave${selectedAircraftList.length > 1 ? 's' : ''} seleccionada${selectedAircraftList.length > 1 ? 's' : ''}`
                  : 'Seleccionar aeronaves'}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedAircraftList.length ? 'Haz clic para ajustar' : 'Busca y agrega'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0">
            <Command>
              <CommandInput
                placeholder="Buscar aeronave..."
                value={aircraftCommandInput}
                onValueChange={setAircraftCommandInput}
              />
              <CommandList>
                {isAircraftFetching && (
                  <CommandItem>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando aeronaves...
                  </CommandItem>
                )}
                {aircraftOptions
                  .filter((aircraft) =>
                    aircraftSearch
                      ? aircraft.acronym.toLowerCase().includes(aircraftSearch.toLowerCase()) ||
                        aircraft.aircraft_type?.full_name?.toLowerCase().includes(aircraftSearch.toLowerCase())
                      : true,
                  )
                  .map((aircraft) => {
                    const label = `${aircraft.acronym} - ${aircraft.aircraft_type?.full_name}`;
                    const isSelected = value?.includes(aircraft.id);
                    return (
                      <CommandItem key={aircraft.id} onSelect={() => toggleAircraft(aircraft)}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border-2 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{aircraft.acronym}</p>
                            <p className="text-xs text-muted-foreground">
                              {aircraft.aircraft_type?.full_name || '(sin tipo de aeronave)'}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                {aircraftOptions.length === 0 && !isAircraftFetching && (
                  <CommandItem className="justify-center text-xs text-muted-foreground">
                    No hay aeronaves disponibles
                  </CommandItem>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </FormControl>
      {selectedAircraftList.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedAircraftList.map((aircraft) => (
            <Badge key={aircraft.id} variant="secondary" className="text-xs flex items-center gap-1">
              {aircraft.acronym}
              <button
                type="button"
                onClick={() => toggleAircraft(aircraft)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
};
