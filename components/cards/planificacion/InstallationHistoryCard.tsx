'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hardTimeInstallationHistoryByAircraftOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';

type InstallationHistoryCardProps = {
  aircraftId: number;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? String(iso)
    : date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMetric = (value?: number | null) => (typeof value === 'number' ? value.toLocaleString('es-VE') : '—');

function HistoryTableHead() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-[32%]">Componente</TableHead>
        <TableHead className="hidden md:table-cell">SN</TableHead>
        <TableHead>Instalado</TableHead>
        <TableHead>Retirado</TableHead>
        <TableHead className="hidden text-right lg:table-cell">FH aeronave</TableHead>
        <TableHead className="hidden text-right lg:table-cell">FC aeronave</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export function InstallationHistoryCard({ aircraftId }: InstallationHistoryCardProps) {
  const { data, isLoading } = useQuery({
    ...hardTimeInstallationHistoryByAircraftOptions({
      path: {
        aircraftId: aircraftId!,
      },
    }),
    enabled: !!aircraftId,
  });

  const rows = data?.data ?? [];

  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-muted/30">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Historial de instalaciones
            </p>
            <p className="truncate text-xs text-muted-foreground">Montajes y desmontajes de componentes Hard Time</p>
          </div>
        </div>
        {!isLoading && rows.length > 0 && (
          <Badge variant="outline" className="shrink-0 text-[11px] tabular-nums">
            {rows.length} registros
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Table>
          <HistoryTableHead />
          <TableBody>
            {Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : rows.length ? (
        <Table>
          <HistoryTableHead />
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="transition-colors">
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs font-medium">{row.part_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.remarks ?? (row.is_manual_entry ? 'Entrada manual' : 'Registro de sistema')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden font-mono text-xs md:table-cell">{row.serial_number || '—'}</TableCell>
                <TableCell className="text-xs">{formatDate(row.installed_at)}</TableCell>
                <TableCell className="text-xs">
                  {row.removed_at ? (
                    formatDate(row.removed_at)
                  ) : (
                    <Badge className="bg-emerald-500/10 text-[10px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                      Activa
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-right font-mono text-xs tabular-nums lg:table-cell">
                  {formatMetric(row.aircraft_hours_at_install)}
                </TableCell>
                <TableCell className="hidden text-right font-mono text-xs tabular-nums lg:table-cell">
                  {formatMetric(row.aircraft_cycles_at_install)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Wrench className="size-8 opacity-20" />
          <p className="text-sm">Sin registros de historial de instalaciones</p>
        </div>
      )}
    </section>
  );
}
