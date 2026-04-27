'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { ListRestart, Search, X } from 'lucide-react';
import { Children, ReactNode, useState } from 'react';

import { DataTablePagination } from '@/components/tables/DataTablePagination';
import { DataTableViewOptions } from '@/components/tables/DataTableViewOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { DataTableContent } from './DataTableContent';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  dialog?: ReactNode | ReactNode[];
}

export function GeneralDataTable<TData, TValue>({
  columns,
  data,
  title = 'Listado',
  dialog,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasActiveFilters = table.getState().columnFilters.length > 0 || !!globalFilter;
  const filteredCount = table.getFilteredRowModel().rows.length;

  const resetAll = () => {
    table.resetColumnFilters();
    setGlobalFilter('');
  };

  return (
    <Card className="rounded-2xl border-none">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{filteredCount} resultado(s)</p>
          </div>

          <div className="flex items-center gap-2">
            {/* <CreateThirdPartyDialog /> */}
            {Children.toArray(dialog)}
            <DataTableViewOptions table={table} />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar en la tabla..."
              className="pl-9 pr-9"
            />
            {!!globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={resetAll} className="justify-center sm:justify-start">
              Reiniciar
              <ListRestart className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-2xl border">
          <ScrollArea className="w-full">
            <div className="min-w-[820px]">
              <DataTableContent table={table} emptyMessage="No se ha encontrado ningún resultado." />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <div className="mt-4">
          <DataTablePagination table={table} />
        </div>
      </CardContent>
    </Card>
  );
}
