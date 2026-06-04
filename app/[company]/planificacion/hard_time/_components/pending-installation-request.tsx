'use client';

import { Badge } from '@/components/ui/badge';
import { HardTimeInstallationRequestResource } from '@api/types';
import { format, parseISO } from 'date-fns';
import { ClockArrowUp, PackagePlus, UserRound } from 'lucide-react';

interface PendingInstallationRequestProps {
  request: HardTimeInstallationRequestResource;
}

export function PendingInstallationRequest({ request }: PendingInstallationRequestProps) {
  return (
    <div className="space-y-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <ClockArrowUp className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Solicitud de montaje pendiente</p>
        <Badge
          variant="outline"
          className="ml-auto h-5 border-amber-500/20 bg-amber-500/10 px-1.5 text-[10px] capitalize text-amber-600 dark:text-amber-400"
        >
          {request.status}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-[22px] text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <PackagePlus className="h-3 w-3" />
          Art. #{request.article_id}
        </span>
        <span className="flex items-center gap-1">
          <UserRound className="h-3 w-3" />
          Solicitante #{request.requested_by}
        </span>
        <span className="flex items-center gap-1">
          <ClockArrowUp className="h-3 w-3" />
          {format(parseISO(request.installed_at), 'dd/MM/yyyy HH:mm')}
        </span>
      </div>
    </div>
  );
}
