'use client';

import { DataTableContent } from '@/components/tables/DataTableContent';
import { DataTablePagination } from '@/components/tables/DataTablePagination';
import { DataTableViewOptions } from '@/components/tables/DataTableViewOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompanyStore } from '@/stores/CompanyStore';
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { Loader2, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState, type Dispatch, type SetStateAction } from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
  totalPages: number;
  isFetching?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchValue,
  onSearchChange,
  onClearSearch,
  pagination,
  setPagination,
  totalPages,
  isFetching,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { selectedCompany } = useCompanyStore();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Buscar orden, aeronave…"
            className="h-9 bg-muted/20 pl-9 pr-9 text-sm"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={onClearSearch}
            >
              <X className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          {isFetching && <span className="text-xs text-muted-foreground">Actualizando…</span>}
          <Link href={`/${selectedCompany?.slug}/planificacion/ordenes_trabajo/crear`}>
            <Button size="sm" className="h-9 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Nueva Orden
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border bg-background">
        {isFetching && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <Loader2 className="size-5 animate-spin text-foreground" />
          </div>
        )}
        <DataTableContent table={table} emptyMessage="No se encontraron órdenes de trabajo." />
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
