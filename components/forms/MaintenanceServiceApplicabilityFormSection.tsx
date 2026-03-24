import { ServiceFormValues } from '@/app/[company]/planificacion/servicios/crear/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TagsInput from '@/components/ui/TagsInput';
import { useGetAircraftTypes } from '@/hooks/planificacion/useGetAircraftTypes';
import { useDebouncedInput } from '@/lib/useDebounce';
import { useCompanyStore } from '@/stores/CompanyStore';
import type { AircraftType } from '@/types';
import { Check, Loader2, PackageOpen, Plane, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

type CoverageTab = 'aircraft' | 'parts';

type Props = {};

const MaintenanceServiceApplicabilityFormSection: React.FC<Props> = () => {
  const { selectedCompany } = useCompanyStore();
  const companySlug = selectedCompany?.slug;
  const [aircraftSearch, setAircraftSearch] = useState('');
  const [coverageTab, setCoverageTab] = useState<CoverageTab>('aircraft');

  const { data: aircraftData, isFetching: isAircraftFetching } = useGetAircraftTypes(companySlug, aircraftSearch);
  const aircraftOptions = aircraftData?.data;

  const [isAircraftPopoverOpen, setIsAircraftPopoverOpen] = useState(false);
  const [aircraftCommandInput, setAircraftCommandInput] = useDebouncedInput('', (value) => {
    setAircraftSearch(value);
  });

  const { control, setValue } = useFormContext<ServiceFormValues>();

  const selectedAircraftIds = useWatch({ name: 'aircraftTypeIds', control });
  const selectedPartNumbers = useWatch({ name: 'partNumbers', control });

  const selectedAircraftList = useMemo(() => {
    return (
      selectedAircraftIds
        ?.map((id) => aircraftOptions?.find((type) => type.id === id))
        .filter((type) => typeof type !== 'undefined') ?? []
    );
  }, [selectedAircraftIds, aircraftOptions]);

  const clearAircraftSelection = useCallback(() => {
    setAircraftCommandInput('');
    setAircraftSearch('');
    setIsAircraftPopoverOpen(false);
    setValue('aircraftTypeIds', []);
  }, [setValue, setAircraftCommandInput, setAircraftSearch, setIsAircraftPopoverOpen]);


  const clearPartSelection = useCallback(() => {
    setValue('partNumbers', []);
  }, [setValue]);


    useEffect(() => {
      if (!isAircraftPopoverOpen) {
        setAircraftCommandInput('');
        setAircraftSearch('');
      }
    }, [isAircraftPopoverOpen, setAircraftCommandInput, setAircraftSearch]);
  
    useEffect(() => {
      if (coverageTab === 'aircraft') {
        clearPartSelection();
        return;
      }
  
      clearAircraftSelection();
    }, [coverageTab, clearAircraftSelection, clearPartSelection]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">APPLICABILITY</p>
          <CardTitle>Modelos y partes aplicables</CardTitle>
        </div>
        <CardDescription>Un servicio puede abarcar múltiples aeronaves o partes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={coverageTab} onValueChange={(value) => setCoverageTab(value as CoverageTab)}>
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="aircraft">
              <Plane className="h-4 w-4 mr-1" />
              <span>Aeronaves</span>
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="parts">
              <PackageOpen className="h-4 w-4 mr-1" />
              <span>Partes</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="aircraft">
            <FormField
              name="aircraftTypeIds"
              control={control}
              render={({ field }) => {
                const toggleAircraft = (type: AircraftType) => {
                  const current = field.value ?? [];
                  const exists = current.includes(type.id);
                  const next = exists ? current.filter((value) => value !== type.id) : [...current, type.id];
                  field.onChange(next);
                };

                return (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <Popover open={isAircraftPopoverOpen} onOpenChange={setIsAircraftPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex h-12 w-full items-center justify-between border-dashed border-border bg-accent/50 text-foreground"
                          >
                            <span>
                              {selectedAircraftList.length
                                ? `${selectedAircraftList.length} modelo${
                                    selectedAircraftList.length > 1 ? 's' : ''
                                  } seleccionado${selectedAircraftList.length > 1 ? 's' : ''}`
                                : 'Seleccionar modelos de aeronave'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {selectedAircraftList.length ? 'Haz clic para ajustar' : 'Busca y agrega'}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] bg-slate-950/90 border-0 p-0">
                          <Command>
                            <CommandInput
                              placeholder="Buscar fabricante, familia o serie"
                              value={aircraftCommandInput}
                              onValueChange={setAircraftCommandInput}
                            />
                            <CommandList>
                              {isAircraftFetching && (
                                <CommandItem className="justify-center text-xs text-muted-foreground">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cargando modelos...
                                </CommandItem>
                              )}
                              {aircraftOptions?.map((type) => {
                                const label = `${type.family} · ${type.series}`;
                                const isSelected = field.value?.includes(type.id);
                                return (
                                  <CommandItem key={type.id} onSelect={() => toggleAircraft(type)}>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">{label}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {type.manufacturer?.name ?? 'Fabricante desconocido'}
                                      </p>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                                  </CommandItem>
                                );
                              })}
                              <CommandEmpty className="text-xs text-muted-foreground">
                                {aircraftSearch ? 'No hay modelos que coincidan.' : 'Sin modelos configurados todavía.'}
                              </CommandEmpty>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                    <div className="flex flex-wrap gap-2">
                      {selectedAircraftList.length ? (
                        selectedAircraftList.map((type) => (
                          <Badge
                            key={type.id}
                            variant="outline"
                            className="flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-3 py-1 text-xs font-semibold text-white"
                          >
                            <span className="truncate">{`${type.family} · ${type.series}`}</span>
                            <button
                              type="button"
                              aria-label={`Quitar ${type.family}`}
                              onClick={() => {
                                const filtered = (field.value ?? []).filter((id) => id !== type.id);
                                field.onChange(filtered);
                              }}
                              className="rounded-full bg-white/10 p-0.5 text-white transition hover:bg-white/20"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No se han agregado modelos aún.</p>
                      )}
                    </div>
                  </FormItem>
                );
              }}
            />
          </TabsContent>
          <TabsContent value="parts">
            <FormField
              name="partNumbers"
              control={control}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-white">Números de parte</FormLabel>
                  <FormControl>
                    <TagsInput value={field.value ?? []} onChange={field.onChange} placeholder="Ej. 123-ABC-456" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MaintenanceServiceApplicabilityFormSection;
