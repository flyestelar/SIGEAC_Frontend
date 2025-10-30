"use client";

import { ContentLayout } from "@/components/layout/ContentLayout";
import LoadingPage from "@/components/misc/LoadingPage";
import { useGetUnits } from "@/hooks/general/unidades/useGetPrimaryUnits";
import { useGetSecondaryUnits } from "@/hooks/general/unidades/useGetSecondaryUnits";
import { columns } from "./columns";
import { PrimaryDataTable } from "./primary-data-table";
import { secondary_columns } from "./secondary-columns";
import { SecondaryDataTable } from "./secondary-data-table";
import { useCompanyStore } from "@/stores/CompanyStore";

const UnitsPage = () => {
  const { selectedCompany } = useCompanyStore();
  const {
    data: primaryUnits,
    isLoading: primaryLoading,
    isError: primaryError,
  } = useGetUnits();
  const {
    data: secondaryUnits,
    isLoading: secondaryLoading,
    isError: secondaryError,
  } = useGetSecondaryUnits();
  if (primaryLoading || secondaryLoading) {
    return <LoadingPage />;
  }
  return (
    <ContentLayout title="Unidades">
      <h1 className="text-5xl font-bold text-center mt-2">
        Control de Unidades
      </h1>
      <p className="text-sm text-muted-foreground text-center italic mt-2">
        Aquí puede llevar el control de las unidades primarias y secundarias para las
        diferentes conversiones necesarias.
      </p>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-center mb-3">
            Unidades Primarias
          </h2>
          <p className="text-sm text-muted-foreground italic text-center mb-3">
            Son las unidades principales que se usan como base, por ejemplo: metro, litro o kilo.
          </p>
          {primaryUnits && (
            <PrimaryDataTable columns={columns} data={primaryUnits} />
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-center mb-3">
            Unidades Secundarias
          </h2>
          <p className="text-sm text-muted-foreground italic text-center mb-3">
            Son las unidades que dependen de las principales, como caja o galón.
          </p>
          {secondaryUnits && (
            <SecondaryDataTable
              columns={secondary_columns}
              data={secondaryUnits}
            />
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default UnitsPage;
