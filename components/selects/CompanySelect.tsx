'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useGetUserLocationsByCompanyId } from '@/hooks/sistema/usuario/useGetUserLocationsByCompanyId';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Company } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, ChevronDown, Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect } from 'react';

const CompanySelect = () => {
  const { user, loading: userLoading } = useAuth();
  const queryClient = useQueryClient();

  const { selectedCompany, selectedStation, setSelectedCompany, setSelectedStation } = useCompanyStore();
  const { data: locations, isPending: locationsLoading, isError } = useGetUserLocationsByCompanyId(selectedCompany?.id);

  const selectedLocation = selectedStation
    ? locations?.find((location) => location.id.toString() === selectedStation)
    : null;

  const handleCompanySelect = (companyId: string) => {
    const company = user?.companies?.find((c) => c.id.toString() === companyId);
    if (company) {
      setSelectedCompany(company);
      queryClient.clear();
    }
  };

  const handleStationSelect = useCallback(
    (value: string) => {
      setSelectedStation(value);
      queryClient.clear();
    },
    [setSelectedStation, queryClient],
  );

  useEffect(() => {
    if (!locationsLoading && locations && locations.length === 1) {
      const onlyLocationId = locations[0].id.toString();
      if (selectedStation !== onlyLocationId) {
        handleStationSelect(onlyLocationId);
      }
    }
  }, [locations, locationsLoading, selectedStation, handleStationSelect]);

  const companyName = selectedCompany
    ? selectedCompany.name[0].toUpperCase() + selectedCompany.name.slice(1)
    : null;

  const stationLabel = selectedLocation ? selectedLocation.cod_iata : null;
  const stationType = selectedLocation ? selectedLocation.type : null;

  return (
    <div className="hidden items-stretch overflow-hidden rounded-lg border bg-background md:flex">
      {/* Company */}
      <Select value={selectedCompany?.id.toString() ?? ''} onValueChange={handleCompanySelect}>
        <SelectTrigger
          aria-label="Seleccionar empresa"
          className={cn(
            'group h-9 w-[190px] gap-2.5 rounded-none border-0 px-3 py-0 transition-colors',
            'hover:bg-muted/40 focus:ring-0 focus:ring-offset-0',
            '[&>svg]:hidden',
          )}
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <Building2 className="size-3" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Empresa
            </span>
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
                  key={companyName ?? 'empty'}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'truncate text-xs font-semibold',
                    companyName ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                >
                  {companyName ?? 'Sin seleccionar'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180" />
        </SelectTrigger>
        <SelectContent align="start">
          {userLoading ? (
            <div className="flex items-center justify-center px-2 py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : user?.companies?.length ? (
            user.companies.map((company: Company) => (
              <SelectItem value={company.id.toString()} key={company.id}>
                <span className="text-sm font-medium capitalize">{company.name}</span>
              </SelectItem>
            ))
          ) : (
            <p className="px-2 py-3 text-xs italic text-muted-foreground">Sin empresas disponibles</p>
          )}
        </SelectContent>
      </Select>

      <div className="w-px self-stretch bg-border" />

      {/* Station */}
      <Select disabled={!selectedCompany} value={selectedStation || ''} onValueChange={handleStationSelect}>
        <SelectTrigger
          aria-label="Seleccionar estación"
          className={cn(
            'group h-9 w-[170px] gap-2.5 rounded-none border-0 px-3 py-0 transition-colors',
            'hover:bg-muted/40 focus:ring-0 focus:ring-offset-0 disabled:opacity-50',
            '[&>svg]:hidden',
          )}
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
            <MapPin className="size-3" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Estación
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {locationsLoading && selectedCompany ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Loader2 className="size-3 animate-spin" />
                </motion.span>
              ) : stationLabel ? (
                <motion.span
                  key={stationLabel}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-baseline gap-1.5 truncate"
                >
                  <span className="font-mono text-xs font-semibold tracking-wider text-foreground">
                    {stationLabel}
                  </span>
                  {stationType && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {stationType}
                    </span>
                  )}
                </motion.span>
              ) : (
                <motion.span
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-medium text-muted-foreground/70"
                >
                  {selectedCompany ? 'Seleccionar' : '—'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180" />
        </SelectTrigger>
        <SelectContent align="start">
          {locationsLoading ? (
            <div className="flex items-center justify-center px-2 py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="px-2 py-3 text-xs italic text-muted-foreground">
              Error al cargar estaciones
            </p>
          ) : locations?.length === 0 ? (
            <p className="px-2 py-3 text-xs italic text-muted-foreground">Sin estaciones disponibles</p>
          ) : (
            locations?.map((location) => (
              <SelectItem value={location.id.toString()} key={location.id}>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold tracking-wider">
                    {location.cod_iata}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {location.type}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelect;
