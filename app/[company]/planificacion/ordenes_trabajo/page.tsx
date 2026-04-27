'use client';

import { workOrdersIndexOptions } from '@api/queries';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDebouncedInput } from '@/lib/useDebounce';

import { columns } from './columns';
import { DataTable } from './data-table';

const WorkOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useDebouncedInput('', setSearchTerm, 400);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    setPagination((previous) => (previous.pageIndex !== 0 ? { ...previous, pageIndex: 0 } : previous));
  }, [searchTerm]);

  const page = pagination.pageIndex + 1;

  const {
    data: workOrdersResponse,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    ...workOrdersIndexOptions({
      query: {
        search: searchTerm || undefined,
        page,
        per_page: pagination.pageSize,
      },
    }),
    placeholderData: keepPreviousData,
  });

  const workOrders = workOrdersResponse?.data ?? [];
  const meta = workOrdersResponse?.meta;
  const pageCount = meta?.last_page ?? 1;
  const total = meta?.total ?? workOrders?.length;
  const initialLoading = isLoading && workOrders?.length === 0;

  if (initialLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Ordenes de Trabajo">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
              <ClipboardList className="size-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Órdenes de Trabajo</h1>
              <p className="text-xs text-muted-foreground">Planificación — Gestión de órdenes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs tabular-nums">
              {total} orden{total !== 1 ? 'es' : ''}
            </Badge>
            {isFetching && !initialLoading && <span className="text-xs text-muted-foreground">Actualizando…</span>}
          </div>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Error al cargar las órdenes de trabajo. Intente recargar la página.</AlertDescription>
          </Alert>
        ) : (
          <DataTable
            columns={columns}
            data={workOrders}
            searchValue={search}
            onSearchChange={setSearch}
            onClearSearch={() => setSearch('')}
            pagination={pagination}
            setPagination={setPagination}
            totalPages={pageCount}
            isFetching={isFetching}
          />
        )}
      </div>
    </ContentLayout>
  );
};

export default WorkOrdersPage;
