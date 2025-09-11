'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useGetExtractions } from '@/hooks/planificacion/directivas/useGetExtractions';
import { useCompanyStore } from '@/stores/CompanyStore';
import { columns } from './columns';
import { DataTable } from './data-table';

const InventarioPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { data: extractions, isLoading, isError } = useGetExtractions();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <ContentLayout title="Inventario">
      <div className="flex flex-col gap-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Planificación</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Directivas (ADs)</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold text-center">Directivas de Mantenimento</h1>
        <p className="text-sm text-muted-foreground text-center italic">
          Aquí puedes ver y gestionar las directivas de mantenimento registradas en el sistema.
        </p>
        {extractions && <DataTable columns={columns} data={extractions} />}
        {isError && <p className="text-muted-foreground italic">Ha ocurrido un error al cargar las directivas...</p>}
      </div>
    </ContentLayout>
  );
};

export default InventarioPage;
