'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetPurchaseOrders } from '@/hooks/mantenimiento/compras/useGetPurchaseOrders';
import { useCompanyStore } from '@/stores/CompanyStore';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from './data-table';

const PurchaseOrdersPage = () => {
  const { selectedStation, selectedCompany } = useCompanyStore();
  const { data: po, isLoading, isError } = useGetPurchaseOrders(
    (selectedCompany && selectedCompany.slug) || null,
    selectedStation || null,
  );

  return (
    <ContentLayout title="Órdenes de Compra">
      <div className="flex flex-col gap-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Compras</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Órdenes de Compra</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="space-y-1.5 border-b pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Compras · PO
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Órdenes de Compra</h1>
          <p className="text-sm text-foreground/70">
            Listado completo de órdenes de compra emitidas por la estación seleccionada.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TableSkeleton />
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3"
            >
              <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Ha ocurrido un error al cargar las órdenes de compra.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <DataTable columns={columns} data={po ?? []} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ContentLayout>
  );
};

export default PurchaseOrdersPage;

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
          style={{ opacity: 1 - i * 0.08 }}
        >
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
