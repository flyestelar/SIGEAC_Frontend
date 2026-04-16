'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { EditPurchaseOrderForm } from '@/components/forms/mantenimiento/compras/EditPurchaseOrderForm';
import LoadingPage from '@/components/misc/LoadingPage';
import { Button } from '@/components/ui/button';
import { useGetPurchaseOrder } from '@/hooks/mantenimiento/compras/useGetPurchaseOrder';
import { useCompanyStore } from '@/stores/CompanyStore';
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
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-sm text-muted-foreground">No se encontró la orden de compra...</p>
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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${company}/compras/ordenes_compra/${order_number}`}>
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Volver
          </Link>
        </Button>
        <h1 className="font-mono text-2xl font-bold">{data.order_number}</h1>
      </div>

      <div className="mx-auto max-w-4xl">
        <EditPurchaseOrderForm
          po={data}
          onSuccess={(newOrderNumber) => router.push(`/${company}/compras/ordenes_compra/${newOrderNumber}`)}
        />
      </div>
    </ContentLayout>
  );
};

export default EditPurchaseOrderPage;
