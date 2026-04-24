/* eslint-disable @next/next/no-img-element */
'use client';

import { Button } from '@/components/ui/button';
import { useCompanySlug } from '@/stores/CompanyStore';
import { AircraftResource } from '@api/types';
import {
    Clock3,
    Plane,
    RotateCcw
} from 'lucide-react';
import Link from 'next/link';

export function AircraftSection({ aircraft }: { aircraft: AircraftResource }) {
  const companySlug = useCompanySlug();

  const aircraftTypeLabel = aircraft?.aircraft_type?.full_name ?? '—';
  const aircraftRegistrationLabel = aircraft?.acronym ?? '—';
  const aircraftModelLabel = aircraft?.model ?? '—';
  const aircraftSerialLabel = aircraft?.serial ?? '—';
  const aircraftManufacturerLabel = aircraft?.aircraft_type?.manufacturer?.name ?? '—';
  const engineTypeLabel = '—';
  const engineSerial1Label = '—';
  const engineSerial2Label = '—';

  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-stretch">
        <div className="relative w-56 shrink-0">
          <img
            src={aircraft.aircraft_type?.image || '/images/aircraft.webp'}
            alt={aircraftRegistrationLabel}
            className="h-full w-full object-cover brightness-[0.55] dark:brightness-[0.35]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="font-mono text-lg font-bold tracking-widest text-white drop-shadow-sm">
                {aircraftRegistrationLabel}
              </span>
              {aircraftTypeLabel && <p className="text-[11px] text-white/70">{aircraftTypeLabel}</p>}
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between gap-y-3 pt-2.5">
          <div className="flex gap-y-3 gap-x-5 px-4 *:flex-1 *:basis-1/4 sm:flex-wrap whitespace-nowrap flex-col sm:flex-row ">
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tipo</p>
              <p className="text-sm font-medium line-clamp-1">{aircraftTypeLabel}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Fabricante</p>
              <p className="text-sm font-medium line-clamp-1">{aircraftManufacturerLabel}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Serial</p>
              <p className="font-mono text-sm font-medium">{aircraftSerialLabel}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Modelo</p>
              <p className="text-sm font-medium">{aircraftModelLabel}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tipo de motor</p>
              <p className="text-sm font-medium line-clamp-1">{engineTypeLabel}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">S/N motor 1</p>
              <p className="font-mono text-sm font-medium">{engineSerial1Label}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">S/N motor 2</p>
              <p className="font-mono text-sm font-medium">{engineSerial2Label}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t bg-muted/20 px-4 py-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3 shrink-0" />
              <span className="font-mono font-medium tabular-nums text-foreground">
                {aircraft.flight_hours?.toLocaleString?.() ?? '—'}
              </span>
              <span>h</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="size-3 shrink-0" />
              <span className="font-mono font-medium tabular-nums text-foreground">
                {aircraft.flight_cycles?.toLocaleString?.() ?? '—'}
              </span>
              <span>ciclos</span>
            </div>
            <div className="ml-auto">
              <Link href={`/${companySlug}/planificacion/aeronaves/${aircraft.acronym}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Plane className="size-3" />
                  Ver aeronave
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
