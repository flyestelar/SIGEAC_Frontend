"use client";

import { Button } from "@/components/ui/button";
import { ObligatoryReportResource } from "@/.gen/api/types.gen";
import axiosInstance from "@/lib/axios";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface PreviewProps {
  title: string;
  obligatoryReport: ObligatoryReportResource;
}

export default function PreviewObligatoryReportPdfDialog({
  title,
  obligatoryReport,
}: PreviewProps) {
  const { selectedCompany } = useCompanyStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!selectedCompany?.slug) return;
    setIsDownloading(true);
    try {
      const response = await axiosInstance.get(
        `/${selectedCompany.slug}/sms/obligatory-reports/${obligatoryReport.id}/pdf`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ROS-${obligatoryReport.report_number ?? obligatoryReport.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="hidden h-8 lg:flex"
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {title}
    </Button>
  );
}
