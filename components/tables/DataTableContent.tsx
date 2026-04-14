import { flexRender, Table as TableType } from '@tanstack/react-table';
import { ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export function DataTableContent<TData>({
  table,
  emptyMessage = 'No se encontraron registros.',
}: {
  table: TableType<TData>;
  emptyMessage?: string;
}) {
  const columnCount = table.getAllColumns().length;
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="bg-muted/20 hover:bg-muted/20">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="text-[11px] font-semibold uppercase tracking-widest">
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columnCount} className="h-32">
              <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                <ClipboardList className="size-7 opacity-20" />
                <p className="text-sm">{emptyMessage}</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
