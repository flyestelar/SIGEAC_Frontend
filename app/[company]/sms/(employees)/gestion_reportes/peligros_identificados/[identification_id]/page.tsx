"use client";
import { useState } from "react";
import CreateAnalysesDialog from "@/components/dialogs/sms/CreateAnalysesDialog";
import CreateDangerIdentificationDialog from "@/components/dialogs/sms/CreateDangerIdentificationDialog";
import DeleteDangerIdentificationDialog from "@/components/dialogs/sms/DeleteDangerIdentificationDialog";
import { ContentLayout } from "@/components/layout/ContentLayout";
import LoadingPage from "@/components/misc/LoadingPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDownloadDangerIdentificationPdf } from "@/actions/sms/peligros_identificados/actions";
import { useGetDangerIdentificationById } from "@/hooks/sms/useGetDangerIdentificationById";
import { useCompanyStore } from "@/stores/CompanyStore";
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  FileDown,
  FileText,
  Info,
  Layers,
  List,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ShowDangerIdentification = () => {
  const { identification_id } = useParams<{ identification_id: string }>();
  const { selectedCompany } = useCompanyStore();
  const { downloadDangerIdentificationPdf } = useDownloadDangerIdentificationPdf();

  const {
    data: dangerIdentification,
    isLoading,
    isError,
  } = useGetDangerIdentificationById({
    company: selectedCompany?.slug,
    id: identification_id,
  });

  const status =
    dangerIdentification?.voluntary_report?.status ??
    dangerIdentification?.obligatory_report?.status ??
    "unknown";

  const id =
    dangerIdentification?.voluntary_report?.id ??
    dangerIdentification?.obligatory_report?.id ??
    "";

  const reportType = dangerIdentification?.voluntary_report
    ? "RVP"
    : dangerIdentification?.obligatory_report
    ? "ROS"
    : "N/A";

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <ContentLayout title="Identificación de Peligro">
      <div className="mt-6 flex flex-col gap-4">
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        {dangerIdentification && (
          <Button
            size="sm"
            disabled={downloadDangerIdentificationPdf.isPending}
            onClick={() =>
              downloadDangerIdentificationPdf.mutate({
                company: selectedCompany!.slug,
                id: dangerIdentification.id,
                report_number:
                  dangerIdentification.voluntary_report?.report_number ??
                  dangerIdentification.obligatory_report?.report_number,
              })
            }
          >
            {downloadDangerIdentificationPdf.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Generar PDF
          </Button>
        )}

        {dangerIdentification && status === "ABIERTO" && (
          <>
            <CreateDangerIdentificationDialog
              title="Editar Identificación"
              id={id}
              isEditing={true}
              initialData={dangerIdentification}
              reportType={reportType}
            />
            <DeleteDangerIdentificationDialog
              id={dangerIdentification.id}
              company={selectedCompany!.slug}
            />
          </>
        )}

        {dangerIdentification && !dangerIdentification.analysis && status === "ABIERTO" && (
          <CreateAnalysesDialog
            buttonTitle="Crear Análisis"
            name="identification"
            id={dangerIdentification.id}
          />
        )}

        {dangerIdentification?.analysis && status === "ABIERTO" && (
          <CreateAnalysesDialog
            buttonTitle="Editar Análisis"
            name="identification"
            id={dangerIdentification.id}
            isEditing={true}
            initialData={dangerIdentification.analysis}
          />
        )}
      </div>

      {/* Contenido principal */}
      <div className="mt-8 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">

        {/* Header de la sección */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <h1 className="text-base font-semibold text-gray-800 dark:text-white">
            Detalles de Identificación de Peligro
          </h1>
        </div>

        {dangerIdentification && (
          <div className="p-4 space-y-4">

            {/* Información básica — apilada en móvil, 3 columnas en md+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Peligro
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {dangerIdentification.danger}
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Área de Peligro
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {dangerIdentification.danger_area ||
                    dangerIdentification.sms_area?.name ||
                    "—"}
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Tipo de Peligro
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {dangerIdentification.danger_type}
                </p>
              </div>
            </div>

            {/* Fuente de información + Descripción — apiladas en móvil, lado a lado en lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {dangerIdentification.information_source && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    Fuente de Información
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Nombre
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {dangerIdentification.information_source.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                        Método de identificación
                      </p>
                      <Badge
                        className={`text-xs font-bold px-2 py-0.5 ${
                          dangerIdentification.information_source.type === "PROACTIVO"
                            ? "bg-green-200 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700"
                            : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                        }`}
                      >
                        {dangerIdentification.information_source.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  Descripción
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {dangerIdentification.description || "N/A"}
                </p>
              </div>
            </div>

            {/* Consecuencias + Defensas — apiladas en móvil, lado a lado en lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {dangerIdentification.possible_consequences && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <List className="w-4 h-4 flex-shrink-0" />
                    Posibles Consecuencias
                  </h3>
                  <ul className="space-y-2">
                    {dangerIdentification.possible_consequences
                      .split("~")
                      .map((consequence, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {consequence.trim()}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {dangerIdentification.current_defenses && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    Defensas Actuales
                  </h3>
                  <ul className="space-y-2">
                    {dangerIdentification.current_defenses
                      .split("~")
                      .map((defense, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {defense.trim()}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Análisis de causa raíz — ocupa todo el ancho */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Análisis de Causa Raíz
              </h3>
              <ul className="space-y-2">
                {dangerIdentification.root_cause_analysis
                  .split("~")
                  .map((analysis, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {index === 0 ? "¿Por qué Sucedió? " : "¿Por qué? "}
                        </span>
                        {analysis.trim()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {isError && (
          <div className="p-6 flex flex-col items-center gap-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <h1 className="text-lg font-bold text-center text-red-600 dark:text-red-400">
              Error al cargar la identificación
            </h1>
            <p className="text-sm text-red-700 dark:text-red-300 text-center">
              No se pudieron cargar los datos de la identificación de peligro
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="border-red-300 text-red-700 hover:bg-red-100 dark:hover:bg-red-800/30"
              >
                Reintentar
              </Button>
              <Link href="/transmandu/sms/peligros_identificados">
                <Button variant="outline" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  Volver a la lista
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </ContentLayout>
  );
};

export default ShowDangerIdentification;
