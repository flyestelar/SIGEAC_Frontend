'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { EditPurchaseOrderForm } from '@/components/forms/mantenimiento/compras/EditPurchaseOrderForm';
import LoadingPage from '@/components/misc/LoadingPage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { useGetPurchaseOrder } from '@/hooks/mantenimiento/compras/useGetPurchaseOrder';
import { useCompanyStore } from '@/stores/CompanyStore';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const EditPurchaseOrderPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { order_number, company } = useParams<{ order_number: string; company: string }>();
  const router = useRouter();

  const { data, isLoading } = useGetPurchaseOrder(selectedCompany?.slug, order_number);

  if (isLoading) return <LoadingPage />;

  if (!data) {
    return (
      <ContentLayout title="Editar Orden de Compra">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-background py-16">
          <p className="text-sm text-muted-foreground">No se encontró la orden de compra.</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Volver
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Editar Orden de Compra">
      <div className="flex flex-col gap-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${company}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${company}/compras/ordenes_compra`}>Órdenes de Compra</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${company}/compras/ordenes_compra/${order_number}`}>
                {data.order_number}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Compras · Edición
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">Editar PO</h1>
              <span className="font-mono text-lg font-semibold text-muted-foreground">
                {data.order_number}
              </span>
            </div>
            <p className="text-sm text-foreground/70">
              Actualiza los datos de la orden de compra. Los cambios afectarán los reportes asociados.
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/${company}/compras/ordenes_compra/${order_number}`}>
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Volver
            </Link>
          </Button>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mx-auto w-full max-w-4xl"
        >
          <EditPurchaseOrderForm
            po={data}
            onSuccess={(newOrderNumber) =>
              router.push(`/${company}/compras/ordenes_compra/${newOrderNumber}`)
            }
          />
        </motion.div>
      </div>
    </ContentLayout>
  );
};

export default EditPurchaseOrderPage;
