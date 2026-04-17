import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AircraftResource } from '@api/types';
import { Clock3, Plane, RotateCcw } from 'lucide-react';

interface AircraftCardProps {
  aircraft: AircraftResource;
  onSelect?: (aircraft: AircraftResource) => void;
  className?: string;
}

const AircraftCard = ({ aircraft, onSelect, className }: AircraftCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect ? () => onSelect(aircraft) : undefined}
      className={cn(
        'group overflow-hidden rounded-lg border bg-background text-left transition-colors duration-150',
        'hover:border-sky-500/40 hover:bg-sky-500/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40',
        className,
      )}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.zbordirect.com/images/airlines/ES.webp"
          alt={aircraft.acronym}
          className="aspect-[16/6] w-full object-cover brightness-[0.5] dark:brightness-[0.3] transition-all duration-300 group-hover:brightness-[0.7] group-hover:scale-[1.02]"
        />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 pb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 backdrop-blur-sm">
            <Plane className="size-3 text-white" />
          </div>
          <span className="font-mono text-sm font-bold tracking-widest text-white">{aircraft.acronym}</span>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium truncate">{aircraft.aircraft_type?.full_name ?? 'Sin tipo'}</p>
          {aircraft.aircraft_type?.manufacturer?.name && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {aircraft.aircraft_type.manufacturer.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock3 className="size-2.5" />
            <span className="font-mono tabular-nums">{aircraft.flight_hours?.toLocaleString?.() ?? '—'}</span> h
          </span>
          <span className="flex items-center gap-1">
            <RotateCcw className="size-2.5" />
            <span className="font-mono tabular-nums">{aircraft.flight_cycles?.toLocaleString?.() ?? '—'}</span> cyc
          </span>
        </div>
      </div>
    </button>
  );
};

export default AircraftCard;
