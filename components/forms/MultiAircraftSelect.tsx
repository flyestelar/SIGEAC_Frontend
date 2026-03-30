'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetMaintenanceAircrafts } from '@/hooks/planificacion/useGetMaintenanceAircrafts';
import { useDebouncedInput } from '@/lib/useDebounce';
import { cn } from '@/lib/utils';
import { AircraftResource } from '@api/types';
import { Check, Loader2, Plane } from 'lucide-react';
import { useMemo, useState } from 'react';

interface MultiAircraftSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  companySlug?: string;
}

export const MultiAircraftSelect = ({ value, onChange, companySlug }: MultiAircraftSelectProps) => {
  const [aircraftSearch, setAircraftSearch] = useState('');
  const [aircraftCommandInput, setAircraftCommandInput] = useDebouncedInput('', setAircraftSearch);
  const [isAircraftPopoverOpen, setIsAircraftPopoverOpen] = useState(false);
  const [manufacturerFilter, setManufacturerFilter] = useState<number | null>(null);

  const { data: aircraftData, isFetching: isAircraftFetching } = useGetMaintenanceAircrafts(companySlug);

  const aircraftOptions = useMemo(() => (aircraftData ?? []) as any as AircraftResource[], [aircraftData]);

  const toggleAircraft = (aircraft: AircraftResource) => {
    const current = value ?? [];
    const exists = current.includes(aircraft.id);
    const next = exists ? current.filter((id: number) => id !== aircraft.id) : [...current, aircraft.id];
    onChange(next);
  };

  const selectedAircraftList = aircraftOptions.filter((aircraft) => value?.includes(aircraft.id));
  const manufacturers = [
    ...new Map(
      aircraftOptions
        .map((aircraft) => aircraft.aircraft_type?.manufacturer)
        .filter((manufacturer) => manufacturer != null)
        .map((manufacturer) => [manufacturer.id, manufacturer] as const),
    ).values(),
  ];

  return (
    <FormItem className="space-y-3">
      <FormLabel className="flex items-center gap-2">
        <Plane className="h-4 w-4" />
        Aeronaves Aplicables
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
              <div className="flex items-center gap-2 px-2 py-1">
                <Button
                  className={cn(
                    'py-0 px-3 min-h-0 h-6 text-xs rounded-full',
                    manufacturerFilter && 'bg-secondary text-secondary-foreground',
                  )}
                  size="sm"
                  onClick={() => setManufacturerFilter(null)}
                >
                  Todos
                </Button>
                {manufacturers.map((manufacturer) => (
                  <Button
                    key={manufacturer.id}
                    size="sm"
                    className={cn(
                      'py-0 px-3 min-h-0 h-6 text-xs rounded-full',
                      manufacturerFilter !== manufacturer.id && 'bg-secondary text-secondary-foreground',
                    )}
                    onClick={() => setManufacturerFilter((prev) => (prev === manufacturer.id ? null : manufacturer.id))}
                  >
                    {manufacturer.name}
                  </Button>
                ))}
              </div>
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
            <Badge key={aircraft.id} variant="secondary" className="text-xs">
              {aircraft.acronym}
            </Badge>
          ))}
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
};
