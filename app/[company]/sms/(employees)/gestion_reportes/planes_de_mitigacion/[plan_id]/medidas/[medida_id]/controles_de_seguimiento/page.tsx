"use client";

import { ContentLayout } from "@/components/layout/ContentLayout";

import { Loader2 } from "lucide-react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { useParams } from "next/navigation";
import { useGetMeasureFollowUpControl } from "@/hooks/sms/useGetMeasureFollowUpControl";
import { useGetMitigationTable } from "@/hooks/sms/useGetMitigationTable";
import { useCompanyStore } from "@/stores/CompanyStore";

type Params = {
  plan_id: string;
  medida_id: string;
};

const FollowUpControlPage = () => {
  const { plan_id, medida_id } = useParams<Params>();
  const { selectedCompany } = useCompanyStore();

  const {
    data: measureFollowUpControls,
    isLoading,
    isError,
  } = useGetMeasureFollowUpControl({
    company: selectedCompany?.slug,
    measure_id: medida_id,
  });

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

  const measureInfo = parentEntry?.mitigation_plan?.measures?.find(
    (m) => m.id === Number(medida_id)
  );

  return (
    <ContentLayout title="Controles de seguimiento">
      <div className="flex flex-col gap-y-2">
        {isLoading && (
          <div className="flex w-full h-full justify-center items-center">
            <Loader2 className="size-24 animate-spin mt-48" />
          </div>
        )}
        {measureFollowUpControls && (
          <DataTable
            columns={columns}
            data={measureFollowUpControls}
            reportInfo={reportInfo}
            measureDescription={measureInfo?.description}
          />
        )}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Ha ocurrido un error al cargar los controles de seguimiento...
          </p>
        )}
      </div>
    </ContentLayout>
  );
};

export default FollowUpControlPage;
