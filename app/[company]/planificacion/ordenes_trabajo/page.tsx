'use client';

import { workOrdersIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardList } from 'lucide-react';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { columns } from './columns';
import { DataTable } from './data-table';

const WorkOrdersPage = () => {
  const {
    data: workOrdersResponse,
    isLoading,
    isError,
  } = useQuery({
    ...workOrdersIndexOptions(),
  });

  const workOrders = workOrdersResponse?.data ?? [];

  if (isLoading) return <LoadingPage />;

  return (
    <ContentLayout title="Ordenes de Trabajo">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
              <ClipboardList className="size-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Órdenes de Trabajo</h1>
              <p className="text-xs text-muted-foreground">Planificación — Gestión de órdenes</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs tabular-nums">
            {workOrders.length} orden{workOrders.length !== 1 ? 'es' : ''}
          </Badge>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Error al cargar las órdenes de trabajo. Intente recargar la página.</AlertDescription>
          </Alert>
        ) : (
          <DataTable columns={columns} data={workOrders} />
        )}
      </div>
    </ContentLayout>
  );
};

export default WorkOrdersPage;
