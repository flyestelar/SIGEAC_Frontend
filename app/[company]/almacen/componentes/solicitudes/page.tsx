'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetInstallRequests } from '@/hooks/planificacion/hard_time/useGetInstallRequests';
import { useApproveInstallRequest, useRejectInstallRequest } from '@/actions/planificacion/hard_time/actions';
import { formatDate } from '@/lib/helpers/format';
import { HardTimeInstallationRequestResource } from '@api/types';
import {
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  Plane,
  SearchCheck,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; badgeClass: string }> = {
  pending: {
    icon: Clock,
    label: 'Pendiente',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Aprobado',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  rejected: {
    icon: XCircle,
    label: 'Rechazado',
    badgeClass: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
};

function RequestCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onApprove,
  onReject,
}: {
  request: HardTimeInstallationRequestResource;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="rounded-lg border border-border/60 bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">Solicitud #{request.id}</span>
            <Badge variant="outline" className={`h-5 gap-1 px-1.5 text-[10px] ${cfg.badgeClass}`}>
              <StatusIcon className="size-3" />
              {cfg.label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Plane className="size-3" />
              {request.aircraft_slot?.aircraft?.acronym ?? '—'}
            </span>
            <span className="flex items-center gap-1">
              <PackageCheck className="size-3" />
              {request.aircraft_slot?.position ?? '—'}
            </span>
            <span className="font-mono">Artículo #{request.article_id}</span>
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-red-500/30 text-[11px] text-red-600 hover:bg-red-500/10"
              onClick={() => onReject(request.id)}
            >
              <XCircle className="size-3.5" />
              Rechazar
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 text-[11px]"
              onClick={() => onApprove(request.id)}
            >
              <CheckCircle2 className="size-3.5" />
              Aprobar
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Fecha instalación
          </p>
          <p className="font-medium text-foreground">{formatDate(request.installed_at)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">FH al montar</p>
          <p className="font-mono font-medium text-foreground">{request.component_hours_at_install}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">FC al montar</p>
          <p className="font-mono font-medium text-foreground">{request.component_cycles_at_install}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Creado</p>
          <p className="font-medium text-foreground">
            {request.created_at ? formatDate(request.created_at) : '—'}
          </p>
        </div>
      </div>

      {request.resolution_reason && (
        <div className="mt-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Motivo de resolución
          </p>
          <p className="mt-0.5 text-xs text-foreground">{request.resolution_reason}</p>
        </div>
      )}
    </div>
  );
}

export default function SolicitudesInstalacionPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const { data: requests = [], isLoading, isError, refetch } = useGetInstallRequests(
    statusFilter === 'all' ? undefined : statusFilter,
  );

  const approveMutation = useApproveInstallRequest(0, null);
  const rejectMutation = useRejectInstallRequest(0, null);

  const handleApprove = (id: number) => {
    approveMutation.mutate({ path: { id } }, { onSuccess: () => refetch() });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ path: { id } }, { onSuccess: () => refetch() });
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <ContentLayout>
      <main className="max-w-5xl">
        <Card className="border-border/60">
          <CardHeader className="flex flex-col gap-3 border-b border-border/60 bg-muted/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold">Solicitudes de Instalación Hard Time</h2>
              <p className="text-xs text-muted-foreground">
                Revisa y procesa las solicitudes de instalación desde almacén.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === 'all'
                    ? 'Todas'
                    : filter === 'pending'
                      ? 'Pendientes'
                      : filter === 'approved'
                        ? 'Aprobadas'
                        : 'Rechazadas'}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <RequestCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                <SearchCheck className="size-5 text-muted-foreground" />
                <p className="text-sm font-semibold">No se pudieron cargar las solicitudes</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                <ClipboardList className="size-5 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  {statusFilter === 'pending' ? 'No hay solicitudes pendientes' : 'No hay solicitudes'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statusFilter === 'pending'
                    ? 'Todas las solicitudes han sido procesadas.'
                    : 'Cambia el filtro para ver otras solicitudes.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {statusFilter === 'pending' && pendingCount > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <Clock className="size-3.5 text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {pendingCount} solicitud{pendingCount !== 1 && 'es'} pendiente{pendingCount !== 1 && 's'} de
                      aprobación
                    </p>
                  </div>
                )}
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </ContentLayout>
  );
}
