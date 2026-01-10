'use client';

import { CreateThirdPartyDialog } from '@/components/dialogs/ajustes/CreateThirdPartyDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { GeneralDataTable } from '@/components/tables/DataTable';
import { useGetThirdParties } from '@/hooks/ajustes/globales/terceros/useGetThirdParties';
import { columns } from './columns';

const ThirdPartyPage = () => {
  const { data, isLoading, isError } = useGetThirdParties();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <ContentLayout title="Clientes">
      <h1 className="text-5xl font-bold text-center mt-2">Control de Terceros</h1>
      <p className="text-sm text-muted-foreground text-center italic mt-2">
        Aquí puede llevar el control de los terceros (empresas/organizaciones/particulares) registrados.
      </p>
      {data && <GeneralDataTable dialog={<CreateThirdPartyDialog />} columns={columns} data={data} />}
      {isError && (
        <p className="text-muted-foreground text-sm italic text-center">
          Ha ocurrido un error al cargar los terceros...
        </p>
      )}
    </ContentLayout>
  );
};

export default ThirdPartyPage;
