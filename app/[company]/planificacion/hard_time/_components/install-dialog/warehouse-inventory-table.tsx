'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArticleDispatchResource, BatchDispatchResource } from '@api/types';
import { AlertCircle, Boxes, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export type WarehouseRow = {
  article: ArticleDispatchResource;
  batch: BatchDispatchResource;
};

interface WarehouseInventoryTableProps {
  rows: WarehouseRow[];
  isLoading: boolean;
  isError: boolean;
  selectedArticleId: number | null;
  onSelectRow: (row: WarehouseRow) => void;
  /** Controlled search value for server-side search. Falls back to local filtering when omitted. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Optional pagination meta — renders pagination controls when provided. */
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

function WarehouseTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[1.1fr_1fr_1fr_0.6fr_0.6fr] gap-3 px-4 py-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</span>;
}

export function WarehouseInventoryTable({
  rows,
  isLoading,
  isError,
  selectedArticleId,
  onSelectRow,
  searchValue: controlledSearch,
  onSearchChange,
  pagination,
  onPageChange,
}: WarehouseInventoryTableProps) {
  const [localSearch, setLocalSearch] = useState('');
  const isControlled = onSearchChange !== undefined;
  const search = isControlled ? (controlledSearch ?? '') : localSearch;

  const displayCount = pagination?.total ?? rows.length;
  const totalCount = pagination?.total ?? rows.length;

  const showPagination = isControlled && pagination && pagination.last_page > 1 && onPageChange;

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-2.5">
        <FieldLabel>Inventario serializado</FieldLabel>
        <span className="text-[11px] text-muted-foreground">
          {isLoading ? 'Cargando…' : `${displayCount} / ${totalCount}`}
        </span>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              if (isControlled) {
                onSearchChange(value);
              } else {
                setLocalSearch(value);
              }
            }}
            placeholder="Serial, P/N o batch"
            className="h-7 pl-8 text-xs"
          />
        </div>
      </div>

      {isError ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>No se pudo cargar inventario de componentes desde almacén.</AlertDescription>
          </Alert>
        </div>
      ) : isLoading ? (
        <WarehouseTableSkeleton />
      ) : rows.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded border bg-muted/30">
            <Boxes className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No hay componentes serializados disponibles</p>
          <p className="text-xs text-muted-foreground">
            No se encontraron artículos en almacén para crear una solicitud.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[260px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/30 backdrop-blur">
              <TableRow className="border-b">
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Serial
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  P/N
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Batch
                </TableHead>
                <TableHead className="h-9 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  FH
                </TableHead>
                <TableHead className="h-9 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  FC
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isSelected = row.article.id === selectedArticleId;
                return (
                  <TableRow
                    key={row.article.id}
                    className={cn(
                      'cursor-pointer border-b transition-colors hover:bg-muted/30',
                      isSelected && 'bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/30 dark:hover:bg-sky-950/40',
                    )}
                    onClick={() => onSelectRow(row)}
                  >
                    <TableCell className="font-mono text-sm font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckCircle2 className="size-3.5 text-sky-600 dark:text-sky-400" />
                        ) : (
                          <span className="size-3.5" />
                        )}
                        {row.article.serial}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{row.article.part_number}</TableCell>
                    <TableCell className="text-sm text-foreground/80">{row.batch.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {row.article.aircraft_part?.total_flight_hours ?? 0}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {row.article.aircraft_part?.total_flight_cycles ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {showPagination ? (
        <div className="flex items-center justify-between border-t bg-muted/15 px-4 py-2">
          <span className="text-[11px] text-muted-foreground">
            {pagination.from}–{pagination.to} de {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pagination.current_page <= 1}
              onClick={() => onPageChange(pagination.current_page - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="min-w-[3rem] text-center text-[11px] text-muted-foreground">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => onPageChange(pagination.current_page + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
