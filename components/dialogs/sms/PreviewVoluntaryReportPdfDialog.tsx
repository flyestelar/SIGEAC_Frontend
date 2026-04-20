"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { VoluntaryReportResource } from "@/.gen/api/types.gen";
import { useCompanyStore } from "@/stores/CompanyStore";
import axiosInstance from "@/lib/axios";

interface PreviewProps {
  title: string;
  voluntaryReport: VoluntaryReportResource;
}

export default function PreviewVoluntaryReportPdfDialog({
  title,
  voluntaryReport,
}: PreviewProps) {
  const { selectedCompany } = useCompanyStore();
  const [open, setOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async (value: boolean) => {
    setOpen(value);
    if (value && !pdfUrl) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(
          `/${selectedCompany?.slug}/sms/voluntary-reports/${voluntaryReport.id}/pdf`,
          { responseType: "blob" },
        );
        const url = URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" }),
        );
        setPdfUrl(url);
      } catch (error) {
        console.error("Error al cargar el PDF:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="flex">
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="hidden lg:flex">
            {title}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[65%] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Vista Previa del Reporte</DialogTitle>
            <DialogDescription>
              Revisa el reporte antes de descargarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[60vh] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded border"
                title="Reporte Voluntario PDF"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No se pudo cargar el PDF.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
