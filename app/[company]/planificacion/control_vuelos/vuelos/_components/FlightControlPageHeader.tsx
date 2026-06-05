'use client';

import { CreateFlightControlDialog } from '@/components/dialogs/aerolinea/administracion/CreateFlightControl';

interface FlightControlPageHeaderProps {
  defaultAircraftId?: string;
}

export function FlightControlPageHeader({ defaultAircraftId }: FlightControlPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Planificación · Vuelos
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Control de horas de vuelo</h1>
        <p className="max-w-[60ch] text-sm text-foreground/70">
          Registro por matrícula con desglose operacional de horas y ciclos.
        </p>
      </div>
      <CreateFlightControlDialog defaultAircraftId={defaultAircraftId} />
    </div>
  );
}
