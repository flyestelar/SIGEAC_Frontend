'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGetHardTimeComponentDetail } from '@/hooks/planificacion/hard_time/useGetHardTimeComponentDetail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  ArrowLeft,
  ClipboardCheck,
  ClipboardPlus,
  Loader2,
  PackageMinus,
  PackagePlus,
} from 'lucide-react';
import { HardTimeIntervalCard } from './hard-time-interval-card';
import { AlertBadge, LEVEL_CONFIG } from './hard-time-shared';

interface HardTimeDetailViewProps {
  componentId: number;
  averageDailyFH?: number | null;
  averageDailyFC?: number | null;
  onBack: () => void;
  onInstall?: () => void;
  onUninstall?: () => void;
  onCreateInterval?: () => void;
  onRegisterCompliance?: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yy', { locale: es });
}

function formatNumber(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-44" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border/60">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HardTimeDetailView({
  componentId,
  averageDailyFH,
  averageDailyFC,
  onBack,
  onInstall,
  onUninstall,
  onCreateInterval,
  onRegisterCompliance,
}: HardTimeDetailViewProps) {
  const {
    data: component,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetHardTimeComponentDetail(componentId);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 px-0 text-muted-foreground hover:bg-transparent" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Volver a componentes
        </Button>
        <Card className="border-border/60">
          <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 py-10 text-center">
            <AlertCircle className="size-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">No se pudo cargar detalle.</p>
              <p className="text-sm text-muted-foreground">Puedes volver o reintentar consulta.</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2 px-0 text-muted-foreground hover:bg-transparent" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Volver a componentes
        </Button>
        <Card className="border-border/60">
          <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm font-semibold">No se encontró componente.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = component.status ?? 'OK';
  const cfg = LEVEL_CONFIG[status];
  const StatusIcon = cfg.icon;
  const intervals = component.installed_part?.intervals ?? [];
  const activeIntervals = intervals.filter((interval) => interval.is_active);
  const installation = component.active_installation;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Button variant="ghost" className="gap-2 px-0 text-muted-foreground hover:bg-transparent" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Volver a componentes
        </Button>

        <Card className={`overflow-hidden border-border/60 ${cfg.cardBorder} ${cfg.cardBg}`}>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                    <StatusIcon className={`h-4 w-4 ${cfg.iconText}`} />
                  </div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">{component.position}</p>
                  <AlertBadge status={status} size="medium" />
                  {isFetching && (
                    <span className="inline-flex h-6 items-center gap-1 rounded-md border border-border/60 px-2 text-[11px] text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Actualizando
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{component.description}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">P/N: {installation?.part_number ?? component.part_number}</span>
                    <span className="font-mono">S/N: {installation?.serial_number ?? '—'}</span>
                    {component.category?.ata_chapter && <span>ATA {component.category.ata_chapter}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Instalado: {formatDate(installation?.installed_at)}</span>
                    <span>FH install: {formatNumber(installation?.aircraft_hours_at_install, 2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {installation ? (
                  <Button variant="outline" className="gap-2" onClick={onCreateInterval}>
                    <ClipboardPlus className="size-4" />
                    Nuevo intervalo
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip delayDuration={80}>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="outline" className="gap-2" disabled>
                            <ClipboardPlus className="size-4" />
                            Nuevo intervalo
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Monta una parte antes de crear intervalos</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button variant="outline" className="gap-2" onClick={installation ? onUninstall : onInstall}>
                  {installation ? <PackageMinus className="size-4" /> : <PackagePlus className="size-4" />}
                  {installation ? 'Desmontar' : 'Montar'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={onRegisterCompliance} disabled={!installation}>
                  <ClipboardCheck className="size-4" />
                  Registrar cumplimiento
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {activeIntervals.length === 0 ? (
        <Card className="border-dashed border-border/70">
          <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-sm font-semibold">Sin intervalos configurados</p>
            <p className="text-sm text-muted-foreground">Componente no tiene intervalos activos para mostrar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeIntervals.map((interval) => (
            <HardTimeIntervalCard
              key={interval.id}
              interval={interval}
              averageDailyFH={averageDailyFH}
              averageDailyFC={averageDailyFC}
            />
          ))}
        </div>
      )}
    </div>
  );
}
