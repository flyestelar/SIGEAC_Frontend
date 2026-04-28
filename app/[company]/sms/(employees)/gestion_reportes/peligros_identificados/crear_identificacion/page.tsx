'use client'

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ContentLayout } from "@/components/layout/ContentLayout";
import CreateDangerIdentificationForm from "@/components/forms/sms/CreateIdentificationForm";
import LoadingPage from "@/components/misc/LoadingPage";

function CreateDangerIdentificationContent() {
  const searchParams = useSearchParams();
  const reporteId = searchParams.get("reporteId");

  if (!reporteId) {
    return (
      <p className="text-sm text-muted-foreground">
        No se proporcionó el ID del reporte.
      </p>
    );
  }

  return (
    <CreateDangerIdentificationForm
      id={Number(reporteId)}
      reportType="RVP"
    />
  );
}

export default function CreateDangerIdentificationPage() {
  return (
    <ContentLayout title="Crear Identificación de Peligro">
      <Suspense fallback={<LoadingPage />}>
        <CreateDangerIdentificationContent />
      </Suspense>
    </ContentLayout>
  );
}
