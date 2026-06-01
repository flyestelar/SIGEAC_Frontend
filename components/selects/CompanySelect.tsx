'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useGetUserLocationsByCompanyId } from '@/hooks/sistema/usuario/useGetUserLocationsByCompanyId';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Company } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Building2, Check, ChevronDown, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const CompanySelect = () => {
  const { user, loading: userLoading } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'company' | 'station'>('company');
  const [search, setSearch] = useState('');

  const { selectedCompany, selectedStation, setSelectedCompany, setSelectedStation } = useCompanyStore();
  const { data: locations, isPending: locationsLoading, isError } = useGetUserLocationsByCompanyId(selectedCompany?.id);

  const selectedLocation = selectedStation
    ? locations?.find((location) => location.id.toString() === selectedStation)
    : null;

  const handleCompanySelect = (companyId: string) => {
    const company = user?.companies?.find((c) => c.id.toString() === companyId);
    if (company) {
      const isSameCompany = selectedCompany?.id === company.id;
      setSelectedCompany(company);
      if (!isSameCompany) {
        setSelectedStation('');
      }
      queryClient.clear();
      setSearch('');
      setStep('station');
    }
  };

  const handleStationSelect = useCallback(
    (value: string) => {
      setSelectedStation(value);
      queryClient.clear();
      setSearch('');
      setOpen(false);
    },
    [setSelectedStation, queryClient],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setSearch('');
    if (nextOpen) {
      setStep(selectedCompany ? 'station' : 'company');
    }
  };

  useEffect(() => {
    if (!locationsLoading && locations && locations.length === 1) {
      const onlyLocationId = locations[0].id.toString();
      if (selectedStation !== onlyLocationId) {
        queueMicrotask(() => {
          handleStationSelect(onlyLocationId);
        });
      }
    }
  }, [locations, locationsLoading, selectedStation, handleStationSelect]);

  const companyName = selectedCompany
    ? selectedCompany.name[0].toUpperCase() + selectedCompany.name.slice(1)
    : null;

  const stationLabel = selectedLocation ? selectedLocation.cod_iata : null;
  const stationType = selectedLocation ? selectedLocation.type : null;

  const normalizedSearch = search.trim().toLowerCase();

  const companyOptions = (user?.companies ?? []).filter((company) =>
    normalizedSearch ? company.name.toLowerCase().includes(normalizedSearch) : true,
  );

  const locationOptions = (locations ?? []).filter((location) =>
    normalizedSearch
      ? location.cod_iata.toLowerCase().includes(normalizedSearch) ||
        location.type?.toLowerCase().includes(normalizedSearch)
      : true,
  );

  const triggerLabel = companyName
    ? stationLabel
      ? `${companyName} / ${stationLabel}`
      : companyName
    : 'Seleccionar empresa y estación';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Seleccionar empresa y estación"
          className={cn(
            'hidden h-9 w-[390px] items-center gap-3 overflow-hidden rounded-lg border bg-background px-3 text-left transition-colors md:flex',
            'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="size-1.5 shrink-0 rounded-full bg-sky-500" />
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <AnimatePresence mode="wait" initial={false}>
                {userLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
                  >
                    <Loader2 className="size-3 animate-spin" />
                  </motion.span>
                ) : (
                  <motion.span
                    key={triggerLabel}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'flex min-w-0 items-baseline gap-1.5 text-xs font-semibold',
                      selectedCompany ? 'text-foreground' : 'text-muted-foreground/70',
                    )}
                  >
                    <span className="truncate">{companyName ?? 'Sin empresa'}</span>
                    {stationLabel ? (
                      <>
                        <span className="text-muted-foreground/60">/</span>
                        <span className="shrink-0 tracking-wider">{stationLabel}</span>
                        {stationType ? (
                          <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                            {stationType}
                          </span>
                        ) : null}
                      </>
                    ) : selectedCompany ? (
                      <span className="text-muted-foreground/70">/ Seleccionar estación</span>
                    ) : null}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <ChevronDown className={cn('size-3 shrink-0 text-muted-foreground/60 transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] p-0">
        <Command>
          <div className="flex items-center gap-2 border-b px-3 py-2">
            {step === 'station' ? (
              <button
                type="button"
                onClick={() => {
                  setStep('company');
                  setSearch('');
                }}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Volver a empresas"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : (
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                <Building2 className="size-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {step === 'company' ? 'Seleccionar empresa' : 'Seleccionar estación'}
              </p>
              <p className="truncate text-sm font-medium">
                {step === 'company' ? 'Primero elige una empresa' : companyName ?? 'Elige una estación'}
              </p>
            </div>
          </div>
          <CommandInput
            placeholder={step === 'company' ? 'Buscar empresa...' : 'Buscar estación...'}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {step === 'company' ? (
              <>
                <CommandEmpty>{userLoading ? 'Cargando empresas...' : 'Sin empresas disponibles'}</CommandEmpty>
                <CommandGroup>
                  {userLoading ? (
                    <CommandItem disabled>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Cargando empresas...
                    </CommandItem>
                  ) : (
                    companyOptions.map((company: Company) => {
                      const isSelected = selectedCompany?.id === company.id;

                      return (
                        <CommandItem key={company.id} value={company.name} onSelect={() => handleCompanySelect(company.id.toString())}>
                          <Building2 className="size-4 text-sky-600" />
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="truncate text-sm font-medium capitalize">{company.name}</span>
                            {isSelected ? <Check className="ml-auto size-4 text-primary" /> : null}
                          </div>
                        </CommandItem>
                      );
                    })
                  )}
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandEmpty>
                  {locationsLoading
                    ? 'Cargando estaciones...'
                    : isError
                      ? 'Error al cargar estaciones'
                      : 'Sin estaciones disponibles'}
                </CommandEmpty>
                <CommandGroup>
                  {locationsLoading ? (
                    <CommandItem disabled>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Cargando estaciones...
                    </CommandItem>
                  ) : isError ? (
                    <CommandItem disabled>Error al cargar estaciones</CommandItem>
                  ) : (
                    locationOptions.map((location) => {
                      const isSelected = selectedStation === location.id.toString();

                      return (
                        <CommandItem
                          key={location.id}
                          value={`${location.cod_iata} ${location.type ?? ''}`}
                          onSelect={() => handleStationSelect(location.id.toString())}
                        >
                          <MapPin className="size-4 text-indigo-600" />
                          <div className="flex min-w-0 flex-1 items-baseline gap-2">
                            <span className="shrink-0 text-sm font-semibold tracking-wider">
                              {location.cod_iata}
                            </span>
                            <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                              {location.type}
                            </span>
                            {isSelected ? <Check className="ml-auto size-4 text-primary" /> : null}
                          </div>
                        </CommandItem>
                      );
                    })
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CompanySelect;
