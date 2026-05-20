'use client';

import RegisterArticleForm from '@/app/[company]/almacen/ingreso/registrar_ingreso/_components/RegisterArticleForm';
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
import { useGetArticleById } from '@/hooks/mantenimiento/almacen/articulos/useGetArticleById';
import { useCompanyStore } from '@/stores/CompanyStore';
import { redirect, useParams } from 'next/navigation';

const EditArticlePage = () => {
  const params = useParams<{ id: string }>();
  const { selectedCompany } = useCompanyStore();
  const { data, isLoading, isError } = useGetArticleById(params.id, selectedCompany?.slug);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !data) {
    redirect(`/${selectedCompany?.slug}/dashboard`);
  }

  return (
    <ContentLayout title="Editar Material">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${selectedCompany?.slug}/almacen/inventario`}>Inventario</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar Material</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <RegisterArticleForm isEditing initialData={data} category={data.batches?.category} />
    </ContentLayout>
  );
};

export default EditArticlePage;
