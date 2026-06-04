'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity,
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ListRestart,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';

import type { MaintenanceAlertStatus, MaintenanceControlExecutionResource, TaskExecutionStatus } from '@api/types';

import { DataTableViewOptions } from '@/components/tables/DataTableViewOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { maintenanceControlExecutionsIndexOptions } from '@api/queries';

// ─── Status config ───────────────────────────────────────────

const STATUS_CONFIG: Record<TaskExecutionStatus, { label: string; dot: string; text: string; bg: string }> = {
  COMPLETED: {
    label: 'Completado',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'border-emerald-500/30 bg-emerald-500/10',
  },
  IN_PROGRESS: {
    label: 'En progreso',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'border-amber-500/30 bg-amber-500/10',
  },
  CANCELLED: {
    label: 'Cancelado',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'border-red-500/30 bg-red-500/10',
  },
};

// ─── Column definitions ──────────────────────────────────────

function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-7 gap-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );
}

const columns: ColumnDef<MaintenanceControlExecutionResource>[] = [
  {
    accessorKey: 'executed_at',
    header: ({ column }) => <SortableHeader column={column}>Fecha ejecución</SortableHeader>,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm font-medium tabular-nums">
        {format(new Date(row.original.executed_at), 'dd MMM yyyy', { locale: es })}
      </span>
    ),
  },
  {
    accessorKey: 'completed_at',
    header: ({ column }) => <SortableHeader column={column}>Fecha completado</SortableHeader>,
    cell: ({ row }) =>
      row.original.completed_at ? (
        <span className="whitespace-nowrap text-sm tabular-nums text-foreground/80">
          {format(new Date(row.original.completed_at), 'dd MMM yyyy', { locale: es })}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground/50">—</span>
      ),
  },
  {
    accessorKey: 'aircraft',
    header: ({ column }) => <SortableHeader column={column}>Aeronave</SortableHeader>,
    accessorFn: (row) => row.aircraft?.acronym ?? '',
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-xs font-semibold text-primary">
        {row.original.aircraft?.acronym ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'current_fh',
    header: ({ column }) => <SortableHeader column={column}>FH</SortableHeader>,
    cell: ({ row }) => <span className="font-mono text-sm tabular-nums">{row.original.current_fh}</span>,
  },
  {
    accessorKey: 'current_fc',
    header: ({ column }) => <SortableHeader column={column}>FC</SortableHeader>,
    cell: ({ row }) => <span className="font-mono text-sm tabular-nums">{row.original.current_fc}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <SortableHeader column={column}>Estado</SortableHeader>,
    cell: ({ row }) => {
      const config = STATUS_CONFIG[row.original.status];
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.bg} ${config.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden />
          {config.label}
        </span>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === 'ALL') return true;
      return row.original.status === filterValue;
    },
  },
  {
    accessorKey: 'notes',
    header: () => (
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Notas</span>
    ),
    cell: ({ row }) =>
      row.original.notes ? (
        <span className="line-clamp-2 max-w-[220px] text-xs text-foreground/80">{row.original.notes}</span>
      ) : (
        <span className="text-sm text-muted-foreground/50">—</span>
      ),
    enableSorting: false,
  },
];

// ─── Component ───────────────────────────────────────────────

interface ExecutionsTableProps {
  controlId: number;
  controlName: string;
  selectedAircraftId: number | null;
}

export function ExecutionsTable({ controlId, controlName, selectedAircraftId }: ExecutionsTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<MaintenanceAlertStatus | 'ALL'>('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: response, isLoading } = useQuery({
    ...maintenanceControlExecutionsIndexOptions({
      query: {
        maintenance_control_id: controlId,
        aircraft_id: selectedAircraftId ?? undefined,
        per_page: perPage,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        page: page,
      },
    }),
  });

  const executions = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const totalItems = meta?.total ?? 0;

  const table = useReactTable({
    data: executions,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const hasActiveFilters = statusFilter !== 'ALL' || !!globalFilter;

  const resetAll = () => {
    setStatusFilter('ALL');
    setGlobalFilter('');
    table.resetColumnFilters();
    setPage(1);
  };

  if (!isLoading && !executions.length && statusFilter === 'ALL' && !globalFilter) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Activity className="h-5 w-5 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground/80">Sin ejecuciones registradas</p>
            <p className="mt-1 text-xs text-muted-foreground">Este control no tiene ejecuciones de mantenimiento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card">
      <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Activity className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ejecuciones
            </span>
            <span className="truncate text-sm font-medium text-foreground/80">{controlName}</span>
            <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {totalItems}
            </span>
          </div>
          <DataTableViewOptions table={table} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-8 pr-8 text-sm"
              />
              {!!globalFilter && (
                <button
                  type="button"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as MaintenanceAlertStatus | 'ALL');
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetAll} className="h-8 gap-1.5 text-xs">
                <ListRestart className="h-3.5 w-3.5" />
                Reiniciar
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardContent className="px-0 pb-0">
        <ScrollArea className="w-full">
          <div className="min-w-[820px]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur supports-[backdrop-filter]:bg-muted/50">
                <TableRow className="border-border/60 hover:bg-transparent">
                  {table.getHeaderGroups().map((headerGroup) =>
                    headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: perPage }).map((_, i) => (
                    <TableRow key={`loading-row-${i}`} className="border-border/40">
                      {columns.map((column, index) => (
                        <TableCell key={`loading-cell-${i}-${column.id ?? index}`} className="align-middle">
                          <Skeleton className="h-4 w-full max-w-[140px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group border-l-2 border-transparent border-b-border/40 transition-colors hover:border-l-primary/40 hover:bg-muted/30"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                      No se encontraron ejecuciones con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Pagination — backend-driven */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 px-5 py-3 sm:flex-row">
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Mostrando {meta?.from ?? 0}–{meta?.to ?? 0} de {totalItems}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Por página</span>
              <Select
                value={String(perPage)}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[64px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              Página {page} de {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="hidden h-7 w-7 lg:flex"
                onClick={() => setPage(1)}
                disabled={isLoading || page <= 1}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={isLoading || page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={isLoading || page >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-7 w-7 lg:flex"
                onClick={() => setPage(totalPages)}
                disabled={isLoading || page >= totalPages}
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
