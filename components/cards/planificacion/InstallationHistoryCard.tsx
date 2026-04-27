'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="h-4 w-4" /> Historial de instalaciones
        </CardTitle>
        <CardDescription className="text-xs">Montajes y desmontajes de componentes Hard Time</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-md border w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Componente</TableHead>
                  <TableHead>PN</TableHead>
                  <TableHead className="hidden md:table-cell">SN</TableHead>
                  <TableHead>Instalado</TableHead>
                  <TableHead>Retirado</TableHead>
                  <TableHead className="hidden lg:table-cell">FH aeronave</TableHead>
                  <TableHead className="hidden lg:table-cell">FC aeronave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : rows.length ? (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Componente</TableHead>
                  <TableHead>PN</TableHead>
                  <TableHead className="hidden md:table-cell">SN</TableHead>
                  <TableHead>Instalado</TableHead>
                  <TableHead>Retirado</TableHead>
                  <TableHead className="hidden lg:table-cell">FH aeronave</TableHead>
                  <TableHead className="hidden lg:table-cell">FC aeronave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{row.part_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.remarks ?? (row.is_manual_entry ? 'Entrada manual' : 'Registro de sistema')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.part_number}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{row.serial_number || '—'}</TableCell>
                    <TableCell>{formatDate(row.installed_at)}</TableCell>
                    <TableCell>
                      {row.removed_at ? (
                        formatDate(row.removed_at)
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Activa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatMetric(row.aircraft_hours_at_install)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatMetric(row.aircraft_cycles_at_install)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Wrench className="size-8 opacity-20" />
            <p className="text-sm">Sin registros de historial de instalaciones</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
