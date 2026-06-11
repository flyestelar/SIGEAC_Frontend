'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaintenanceAircraft } from '@/types';
import { differenceInYears } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Factory, MapPin, Pencil, Plane, RotateCcw, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FieldLabel, formatDate, formatNumber } from './shared';

function SpecCell({
  icon: Icon,
  label,
  value,
  detail,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  detail?: string;
  mono?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <FieldLabel className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </FieldLabel>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${mono ? 'font-mono' : ''}`}>{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function AircraftHeader({ aircraft, onEdit }: { aircraft: MaintenanceAircraft; onEdit: () => void }) {
  const router = useRouter();
  const fabDate = aircraft.fabricant_date ? new Date(aircraft.fabricant_date) : null;
  const ageYears = fabDate && !Number.isNaN(fabDate.getTime()) ? differenceInYears(new Date(), fabDate) : null;

  return (
    <header className="overflow-hidden rounded-lg border bg-background">
      {/* Identity bar */}
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Volver"
            onClick={() => router.back()}
            className="h-8 w-8 shrink-0 transition-transform active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-sky-500/30 bg-sky-500/10">
            <Plane className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-semibold leading-none tracking-widest">{aircraft.acronym}</h1>
              <Badge variant="outline" className="font-mono text-[10px]">
                S/N {aircraft.serial || '—'}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-foreground/80">
              {aircraft.aircraft_type?.full_name ?? 'Tipo sin asignar'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="shrink-0 transition-transform active:scale-[0.97]"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Context strip — AIRCRAFT accent */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-sky-200 bg-sky-50 px-5 py-2.5 dark:border-sky-800/40 dark:bg-sky-950/20">
        <span className="text-[11px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400">
          Aeronave
        </span>
        <span className="flex items-center gap-1.5 text-xs text-sky-900/80 dark:text-sky-200/80">
          <Factory className="h-3 w-3" />
          {aircraft.manufacturer?.name ?? '—'}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-sky-900/80 dark:text-sky-200/80">
          <MapPin className="h-3 w-3" />
          {aircraft.location?.name ?? aircraft.location?.address ?? '—'}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-sky-900/80 dark:text-sky-200/80">
          <User className="h-3 w-3" />
          {aircraft.client?.name ?? '—'}
        </span>
      </div>

      {/* Spec band */}
      <div className="grid grid-cols-2 border-t md:grid-cols-4 md:divide-x">
        <SpecCell
          icon={Clock}
          label="Horas de vuelo"
          value={formatNumber(aircraft.flight_hours, 1)}
          detail="FH acumuladas"
          mono
        />
        <SpecCell
          icon={RotateCcw}
          label="Ciclos"
          value={formatNumber(aircraft.flight_cycles)}
          detail="FC acumulados"
          mono
        />
        <SpecCell
          icon={Calendar}
          label="Fabricación"
          value={formatDate(aircraft.fabricant_date)}
          detail={ageYears !== null ? `${ageYears} años en servicio` : undefined}
        />
        <SpecCell
          icon={Calendar}
          label="Actualizado"
          value={formatDate(aircraft.updated_at)}
          detail="Último registro"
        />
      </div>
    </header>
  );
}
