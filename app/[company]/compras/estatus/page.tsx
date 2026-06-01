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
import { useCompanyStore } from '@/stores/CompanyStore';
import { motion } from 'motion/react';
import { Construction } from 'lucide-react';

const StatusOrderPage = () => {
  const { selectedCompany } = useCompanyStore();

  return (
    <ContentLayout title="Estado de Compra">
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
              <BreadcrumbPage>Estado</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="space-y-1.5 border-b pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Compras · Seguimiento
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Estado de Compra</h1>
          <p className="text-sm text-foreground/70">
            Vista de seguimiento del ciclo de vida de las órdenes de compra.
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background px-6 py-16 text-center"
        >
          <div className="flex size-12 items-center justify-center rounded-lg border bg-muted/30">
            <Construction className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Módulo en construcción</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              El seguimiento de estados de compra estará disponible próximamente.
            </p>
          </div>
        </motion.div>
      </div>
    </ContentLayout>
  );
};

export default StatusOrderPage;
