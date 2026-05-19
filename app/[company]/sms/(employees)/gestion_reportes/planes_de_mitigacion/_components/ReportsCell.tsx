"use client";

import {
  useDownloadAnalysisPdf,
  useDownloadMitigationPlanPdf,
} from "@/actions/sms/planes_de_mitigation/actions";
import { Button } from "@/components/ui/button";
import { useCompanyStore } from "@/stores/CompanyStore";
import { MitigationTable } from "@/types";
import { FileDown, Loader2 } from "lucide-react";

interface ReportsCellProps {
  mitigationTable: MitigationTable;
}

export const ReportsCell = ({ mitigationTable }: ReportsCellProps) => {
  const { selectedCompany } = useCompanyStore();
  const { downloadMitigationPlanPdf } = useDownloadMitigationPlanPdf();
  const { downloadAnalysisPdf } = useDownloadAnalysisPdf();

  const hasPlan = Boolean(mitigationTable.mitigation_plan?.id);
  const hasAnalysis = Boolean(mitigationTable.mitigation_plan?.analysis);

  if (!hasPlan) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 w-full"
        disabled={downloadMitigationPlanPdf.isPending}
        onClick={() =>
          downloadMitigationPlanPdf.mutate({
            company: selectedCompany!.slug,
            id: mitigationTable.mitigation_plan!.id,
          })
        }
      >
        {downloadMitigationPlanPdf.isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <FileDown className="size-3 text-blue-500" />
        )}
        Plan de Acción
      </Button>

      {hasAnalysis && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 w-full"
          disabled={downloadAnalysisPdf.isPending}
          onClick={() =>
            downloadAnalysisPdf.mutate({
              company: selectedCompany!.slug,
              id: mitigationTable.id,
            })
          }
        >
          {downloadAnalysisPdf.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <FileDown className="size-3 text-amber-500" />
          )}
          Análisis Post-Mit.
        </Button>
      )}
    </div>
  );
};
