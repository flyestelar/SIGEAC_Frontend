'use client';

import { useState } from 'react';
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
import { ArrowUpDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ListRestart, Search, X, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { maintenanceControlsExecutionsIndexOptions } from '@api/queries';
import type { MaintenanceControlExecutionResource, TaskExecutionStatus } from '@api/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableViewOptions } from '@/components/tables/DataTableViewOptions';

// ─── Status config ───────────────────────────────────────────

const STATUS_CONFIG: Record<TaskExecutionStatus, { label: string; className: string }> = {
  COMPLETED: {
    label: 'Completado',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  IN_PROGRESS: {
    label: 'En progreso',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};

// ─── Column definitions ──────────────────────────────────────

function SortableHeader({ column, children }: { column: any; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="ml-1.5 h-3 w-3" />
    </Button>
  );
}

const columns: ColumnDef<MaintenanceControlExecutionResource>[] = [
  {
    accessorKey: 'executed_at',
    header: ({ column }) => <SortableHeader column={column}>Fecha ejecución</SortableHeader>,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm font-medium">
        {format(new Date(row.original.executed_at), 'dd MMM yyyy', { locale: es })}
      </span>
    ),
  },
  {
    accessorKey: 'completed_at',
    header: ({ column }) => <SortableHeader column={column}>Fecha completado</SortableHeader>,
    cell: ({ row }) =>
      row.original.completed_at ? (
        <span className="whitespace-nowrap text-sm text-foreground/80">
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
      <span className="whitespace-nowrap font-mono text-xs font-medium text-primary">
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
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
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
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas</span>
    ),
    cell: ({ row }) =>
      row.original.notes ? (
        <span className="line-clamp-2 max-w-[200px] text-xs text-foreground/80">{row.original.notes}</span>
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
}

export function ExecutionsTable({ controlId, controlName }: ExecutionsTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: response, isLoading } = useQuery({
    ...maintenanceControlsExecutionsIndexOptions({
      path: { maintenance_control: String(controlId) },
      query: {
        per_page: perPage,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        page: page as any,
      } as any,
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

  if (isLoading) {
    return <ExecutionsTableSkeleton />;
  }

  if (!executions.length && statusFilter === 'ALL' && !globalFilter) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Activity className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">Sin ejecuciones registradas</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Este control no tiene ejecuciones de mantenimiento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Ejecuciones
              <span className="font-normal normal-case tracking-normal text-foreground">— {controlName}</span>
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalItems} ejecuci{totalItems === 1 ? 'ón' : 'ones'} en total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-9 pr-9 text-sm"
              />
              {!!globalFilter && (
                <button
                  type="button"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetAll} className="h-8">
              Reiniciar
              <ListRestart className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <ScrollArea className="w-full">
          <div className="min-w-[820px]">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="group border-border/40 hover:bg-muted/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">
            Mostrando {meta?.from ?? 0}–{meta?.to ?? 0} de {totalItems}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Items por página:</span>
              <Select
                value={String(perPage)}
                onValueChange={(value) => {
                  setPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[60px] text-xs">
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

            <span className="text-xs font-medium text-muted-foreground">
              Página {page} de {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="hidden h-7 w-7 lg:flex"
                onClick={() => setPage(1)}
                disabled={page <= 1}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-7 w-7 lg:flex"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
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

// ─── Skeleton ────────────────────────────────────────────────

function ExecutionsTableSkeleton() {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="space-y-0 divide-y divide-border/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-7 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}
