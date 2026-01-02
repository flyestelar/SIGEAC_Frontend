'use client';

import React, { Fragment, useMemo, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { RegisterDispatchRequestDialog } from '@/components/dialogs/mantenimiento/almacen/RegisterDispatchRequestDialog';
import { DispatchReportDialog } from '@/components/dialogs/mantenimiento/almacen/DispatchReportDialog';
import { DataTablePagination } from '@/components/tables/DataTablePagination';
import { DataTableViewOptions } from '@/components/tables/DataTableViewOptions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // ✅ opcional: si quieres un “detalle” custom por pantalla
  renderSubComponent?: (row: TData) => React.ReactNode;
  // ✅ si una fila puede expandirse (por defecto: true)
  canExpandRow?: (row: TData) => boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  renderSubComponent,
  canExpandRow,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),

    getRowCanExpand: (row) => (canExpandRow ? canExpandRow(row.original) : true),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <>
      <div className="flex items-center py-4">
        <div className="flex gap-x-2 items-center">
          <RegisterDispatchRequestDialog />
          <DispatchReportDialog />
        </div>
        <div className="ml-auto">
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>

                  {row.getIsExpanded() && renderSubComponent && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={visibleColumnCount} className="p-0">
                        {renderSubComponent(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No se ha encontrado ningún resultado...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </>
  );
}
