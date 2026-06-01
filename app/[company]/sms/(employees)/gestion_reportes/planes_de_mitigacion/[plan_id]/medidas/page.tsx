"use client";

import { ContentLayout } from "@/components/layout/ContentLayout";

import { Loader2 } from "lucide-react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useGetMitigationMeasure } from "@/hooks/sms/useGetMitigationMeasure";
import { useGetMitigationTable } from "@/hooks/sms/useGetMitigationTable";
import { useParams } from "next/navigation";
import { useCompanyStore } from "@/stores/CompanyStore";

const MitigationMeasurePage = () => {
  const { plan_id } = useParams<{ plan_id: string }>();
  const { selectedCompany } = useCompanyStore();

  const {
    data: mitigationMeasure,
    isLoading,
    isError,
  } = useGetMitigationMeasure({ company: selectedCompany?.slug, plan_id });

  const { data: mitigationTable } = useGetMitigationTable(selectedCompany?.slug);

  const parentEntry = mitigationTable?.find(
    (row) => row.mitigation_plan?.id === Number(plan_id)
  );

  const reportInfo = parentEntry
    ? parentEntry.obligatory_report
      ? {
          type: "obligatory" as const,
          report_number: parentEntry.obligatory_report.report_number,
          status: parentEntry.obligatory_report.status,
          danger: parentEntry.danger,
        }
      : parentEntry.voluntary_report
      ? {
          type: "voluntary" as const,
          report_number: parentEntry.voluntary_report.report_number ?? "—",
          status: parentEntry.voluntary_report.status,
          danger: parentEntry.danger,
        }
      : undefined
    : undefined;

  return (
    <ContentLayout title="Medidas de Mitigacion">
      <div className="flex flex-col gap-y-2">
        {isLoading && (
          <div className="flex w-full h-full justify-center items-center">
            <Loader2 className="size-24 animate-spin mt-48" />
          </div>
        )}
        {mitigationMeasure && (
          <DataTable columns={columns} data={mitigationMeasure} reportInfo={reportInfo} />
        )}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Ha ocurrido un error al cargar los medidas de mitigacion...
          </p>
        )}
      </div>
    </ContentLayout>
  );
};

export default MitigationMeasurePage;
