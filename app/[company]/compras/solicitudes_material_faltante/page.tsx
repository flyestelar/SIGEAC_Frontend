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
import { useAuth } from '@/contexts/AuthContext';
import { useGetRequisition } from '@/hooks/mantenimiento/compras/useGetRequisitions';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Requisition } from '@/types';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { columns } from './columns';
import { DataTable } from './data-table';

const FULL_ACCESS_ROLES = ['SUPERUSER', 'ANALISTA_COMPRAS', 'JEFE_COMPRAS'];

const RequisitionsPage = () => {
  const { user } = useAuth();
  const { selectedCompany, selectedStation } = useCompanyStore();
  const { data: requisitions, isLoading, isError } = useGetRequisition(
    selectedCompany?.slug,
    selectedStation || undefined,
  );

  const hasFullAccess = useMemo(
    () => user?.roles?.some((role) => FULL_ACCESS_ROLES.includes(role.name)) ?? false,
    [user],
  );

  const [filteredRequisitions, setFilteredRequisitions] = useState<Requisition[]>([]);

  useEffect(() => {
    if (!requisitions) {
      setFilteredRequisitions([]);
      return;
    }
    setFilteredRequisitions(
      hasFullAccess
        ? requisitions
        : requisitions.filter((req) => req.created_by?.id === user?.id),
    );
  }, [requisitions, user, hasFullAccess]);

  return (
    <ContentLayout title="Solicitudes de Material Faltante">
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
              <BreadcrumbPage>Solicitudes de Material</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Compras · Requisiciones
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Solicitudes de Material Faltante</h1>
            <p className="text-sm text-foreground/70">
              Requisiciones de compra generadas. Filtra y busca por número, aeronave o estado.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span className="font-semibold uppercase tracking-widest">
              {hasFullAccess ? 'Acceso completo' : 'Mis solicitudes'}
            </span>
            <span className="text-muted-foreground/40">·</span>
            {isLoading ? (
              <Skeleton className="h-3.5 w-16" />
            ) : (
              <span className="font-mono font-medium text-foreground">
                {filteredRequisitions.length.toLocaleString('es-VE')}
              </span>
            )}
          </div>
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
                Ha ocurrido un error al cargar las solicitudes de compra.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <DataTable columns={columns} data={filteredRequisitions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ContentLayout>
  );
};

export default RequisitionsPage;

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
