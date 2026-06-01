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
import { ChevronDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
    <div
      className={cn(
        'hidden items-stretch overflow-hidden rounded-full md:flex',
        'border border-border/50 bg-background/40 backdrop-blur-sm',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
      )}
    >
      {/* Company */}
      <Select value={selectedCompany?.id.toString() ?? ''} onValueChange={handleCompanySelect}>
        <SelectTrigger
          aria-label="Seleccionar empresa"
          className={cn(
            'group h-8 w-[200px] gap-2 rounded-none border-0 bg-transparent px-3 py-0',
            'transition-colors duration-150 ease-out',
            'hover:bg-foreground/[0.04] focus:ring-0 focus:ring-offset-0',
            'active:scale-[0.99]',
            '[&>svg]:hidden',
          )}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-sky-500" />
          <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Empresa
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {userLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
                >
                  <Loader2 className="size-3 animate-spin" />
                </motion.span>
              ) : (
                <motion.span
                  key={companyName ?? 'empty'}
                  initial={{ opacity: 0, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(2px)' }}
                  transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  className={cn(
                    'w-full truncate text-left text-xs font-semibold',
                    companyName ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                >
                  {companyName ?? 'Sin seleccionar'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <ChevronDown
            className={cn(
              'size-3 shrink-0 text-muted-foreground/60',
              'transition-transform duration-200 ease-out',
              'group-data-[state=open]:rotate-180',
            )}
          />
        </SelectTrigger>
        <SelectContent align="start" sideOffset={8}>
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

      <div className="w-px self-stretch bg-border/60" />

      {/* Station */}
      <Select disabled={!selectedCompany} value={selectedStation || ''} onValueChange={handleStationSelect}>
        <SelectTrigger
          aria-label="Seleccionar estación"
          className={cn(
            'group h-8 w-[170px] gap-2 rounded-none border-0 bg-transparent px-3 py-0',
            'transition-colors duration-150 ease-out',
            'hover:bg-foreground/[0.04] focus:ring-0 focus:ring-offset-0 disabled:opacity-50',
            'active:scale-[0.99]',
            '[&>svg]:hidden',
          )}
        >
          <span className="size-1.5 shrink-0 rounded-full bg-indigo-500" />
          <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              Estación
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {locationsLoading && selectedCompany ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Loader2 className="size-3 animate-spin" />
                </motion.span>
              ) : stationLabel ? (
                <motion.span
                  key={stationLabel}
                  initial={{ opacity: 0, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(2px)' }}
                  transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  className="flex w-full min-w-0 items-baseline gap-1.5"
                >
                  <span className="shrink-0 font-mono text-xs font-semibold tracking-wider text-foreground">
                    {stationLabel}
                  </span>
                  {stationType && (
                    <span className="min-w-0 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
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
                  transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                  className="text-xs font-medium text-muted-foreground/70"
                >
                  {selectedCompany ? 'Seleccionar' : '—'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <ChevronDown
            className={cn(
              'size-3 shrink-0 text-muted-foreground/60',
              'transition-transform duration-200 ease-out',
              'group-data-[state=open]:rotate-180',
            )}
          />
        </SelectTrigger>
        <SelectContent align="start" sideOffset={8}>
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
