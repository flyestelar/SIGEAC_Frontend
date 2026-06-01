"use client";

import CreateFollowUpControlDialog from "@/components/dialogs/sms/CreateFollowUpControlDialog";
import { DataTablePagination } from "@/components/tables/DataTablePagination";
import { DataTableViewOptions } from "@/components/tables/DataTableViewOptions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportInfo {
  type: "obligatory" | "voluntary";
  report_number: string;
  status: string;
  danger: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  reportInfo?: ReportInfo;
  measureDescription?: string;
}

const STATUS_CFG: Record<string, string> = {
  CERRADO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ABIERTO: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  PROCESO: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function DataTable<TData, TValue>({
  columns,
  data,
  reportInfo,
  measureDescription,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const router = useRouter();
  
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="w-fit -ml-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a medidas de mitigación
            </Button>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Medida de Mitigación
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Controles de Seguimiento
            </h1>
          </div>

          {reportInfo && (
            <div className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-lg border shrink-0",
              reportInfo.type === "obligatory"
                ? "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800"
                : "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800"
            )}>
              {reportInfo.type === "obligatory"
                ? <AlertTriangle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                : <FileText className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
              }
              <div className="flex flex-col gap-0.5">
                <p className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.14em]",
                  reportInfo.type === "obligatory"
                    ? "text-sky-700 dark:text-sky-400"
                    : "text-violet-700 dark:text-violet-400"
                )}>
                  {reportInfo.type === "obligatory" ? "Reporte Obligatorio" : "Reporte Voluntario"}
                </p>
                <p className={cn(
                  "text-sm font-semibold",
                  reportInfo.type === "obligatory"
                    ? "text-sky-900 dark:text-sky-200"
                    : "text-violet-900 dark:text-violet-200"
                )}>
                  {reportInfo.type === "obligatory" ? "ROS" : "RVS"}-{reportInfo.report_number}
                </p>
              </div>
              <div className="w-px h-8 bg-border mx-1" />
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold tracking-wider uppercase",
                STATUS_CFG[reportInfo.status] ?? "border-border bg-muted text-muted-foreground"
              )}>
                {reportInfo.status}
              </span>
            </div>
          )}
        </div>

        {(reportInfo || measureDescription) && (
          <div className="flex flex-col gap-1.5">
            {reportInfo && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border border-border rounded-md">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Peligro:</span>
                <span className="text-sm font-medium text-foreground truncate">{reportInfo.danger}</span>
              </div>
            )}
            {measureDescription && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border border-border rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">Medida:</span>
                <span className="text-sm font-medium text-foreground truncate">{measureDescription}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center py-4">
         <CreateFollowUpControlDialog/>
        <DataTableViewOptions table={table} />
      </div>

      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
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
