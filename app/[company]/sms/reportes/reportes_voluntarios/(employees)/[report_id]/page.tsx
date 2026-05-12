"use client";
import CreateDangerIdentificationDialog from "@/components/dialogs/sms/CreateDangerIdentificationDialog";
import CreateVoluntaryReportDialog from "@/components/dialogs/sms/CreateVoluntaryReportDialog";
import DeleteVoluntaryReportDialog from "@/components/dialogs/sms/DeleteVoluntaryReportDialog";
import PreviewVoluntaryReportPdfDialog from "@/components/dialogs/sms/PreviewVoluntaryReportPdfDialog";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGetVoluntaryReportById } from "@/hooks/sms/useGetVoluntaryReportById";
import { dateFormat } from "@/lib/utils";
import { useCompanyStore } from "@/stores/CompanyStore";
import axiosInstance from "@/lib/axios";
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  FileText,
  Loader2,
  User,
  File,
  Download,
  CalendarCheck,
  ArrowLeft,
  Maximize2,
  Shield,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const formatFriendly = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  const soloFecha = dateString.split(" ")[0];
  const [year, month, day] = soloFecha.split("-");
  return `${day}-${month}-${year}`;
};

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm font-medium leading-relaxed text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <CardContent className="px-5 pb-5 pt-0">{children}</CardContent>
    </Card>
  );
}

const ShowVoluntaryReport = () => {
  const { report_id } = useParams<{ report_id: string }>();
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();

  const {
    data: voluntaryReport,
    isLoading,
    isError,
  } = useGetVoluntaryReportById({
    id: report_id,
    company: selectedCompany?.slug,
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!voluntaryReport?.image) return;
    let objectUrl: string;
    let cancelled = false;
    axiosInstance
      .get(voluntaryReport.image, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        const blob = new Blob([response.data], {
          type: String(response.headers["content-type"] ?? "image/jpeg"),
        });
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      })
      .catch((err) => console.error("Error cargando imagen:", err));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [voluntaryReport?.image]);

  const downloadDocument = async (url: string, filename: string) => {
    setIsDownloading(true);
    try {
      const response = await axiosInstance.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("Error descargando documento:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isClosed = voluntaryReport?.status === "CERRADO";
  const statusColor = isClosed ? "#16a34a" : "#dc2626";
  const statusBg = isClosed ? "#f0fdf4" : "#fef2f2";

  return (
    <ContentLayout title="">
      <div className="mx-auto max-w-6xl">
        {/* ── Back ── */}
        <button
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          onClick={() => router.push(`/${selectedCompany?.slug}/sms/reportes`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a reportes
        </button>

        {/* ── Header ── */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-5 rounded-xl bg-slate-900 px-8 py-7">
          <div>
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Reporte Voluntario de Peligro
            </p>
            <p className="font-mono text-[clamp(28px,5vw,44px)] font-semibold leading-none tracking-tight text-slate-100">
              <span className="text-sky-400">RVP</span>-{voluntaryReport?.report_number ?? "···"}
            </p>
            {voluntaryReport && (
              <span
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.08em]"
                style={{
                  color: statusColor,
                  background: statusBg,
                  borderColor: statusColor + "55",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                {voluntaryReport.status}
              </span>
            )}
          </div>

          {voluntaryReport && (
            <div className="flex flex-wrap items-center gap-2">
              {voluntaryReport.status === "ABIERTO" && (
                <>
                  {!voluntaryReport.danger_identification_id ? (
                    <CreateDangerIdentificationDialog
                      title="Crear Identificación de Peligro"
                      id={voluntaryReport.id}
                      reportType="RVP"
                    />
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/${selectedCompany?.slug}/sms/gestion_reportes/peligros_identificados/${voluntaryReport.danger_identification_id}`}
                      >
                        <Shield className="mr-1.5 h-4 w-4" />
                        Ver Peligro
                      </Link>
                    </Button>
                  )}
                  <CreateVoluntaryReportDialog
                    initialData={voluntaryReport}
                    isEditing
                    title="Editar"
                  />
                  <DeleteVoluntaryReportDialog
                    company={selectedCompany!.slug}
                    id={voluntaryReport.id.toString()}
                  />
                </>
              )}
              <PreviewVoluntaryReportPdfDialog
                title="Descargar PDF"
                voluntaryReport={voluntaryReport}
              />
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
          </div>
        )}

        {/* ── Content ── */}
        {voluntaryReport && (
          <div className="space-y-4">
            {/* Row 1: Información General + Ubicación + Reporter */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <SectionCard icon={FileText} title="Información General">
                <div className="space-y-0 pt-4">
                  <FieldRow
                    label="N° Reporte"
                    value={
                      voluntaryReport.report_number
                        ? `RVP-${voluntaryReport.report_number}`
                        : undefined
                    }
                    mono
                  />
                  <FieldRow
                    label="Fecha del Reporte"
                    value={
                      voluntaryReport.report_date
                        ? format(
                            new Date(voluntaryReport.report_date.replace(/-/g, "/")),
                            "PPP",
                            { locale: es },
                          )
                        : undefined
                    }
                  />
                  <FieldRow
                    label="Fecha de Identificación"
                    value={dateFormat(voluntaryReport.identification_date || "", "PPP")}
                  />
                  {isClosed && voluntaryReport.close_date && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 dark:border-green-800 dark:bg-green-950">
                      <CalendarCheck className="h-4 w-4 flex-shrink-0 text-green-600" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-green-700 dark:text-green-400">
                          Fecha de Cierre
                        </p>
                        <p className="font-mono text-sm font-semibold text-green-800 dark:text-green-300">
                          {formatFriendly(voluntaryReport.close_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard icon={MapPin} title="Ubicación del Peligro">
                <div className="space-y-0 pt-4">
                  <FieldRow
                    label="Área de Identificación"
                    value={
                      voluntaryReport.finding_location ||
                      voluntaryReport.sms_finding_location?.name
                    }
                  />
                  <FieldRow label="Estación" value={voluntaryReport.station || (voluntaryReport as any).sms_station?.name} />
                  <FieldRow
                    label="Otra Localización"
                    value={voluntaryReport.finding_location_other}
                  />
                </div>
              </SectionCard>

              <SectionCard icon={User} title="Información del Reportero">
                <div className="pt-4">
                  {voluntaryReport.is_anonymous ? (
                    <div className="flex items-center pt-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        Reporte Anónimo
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      <FieldRow
                        label="Nombre"
                        value={[
                          voluntaryReport.reporter_name,
                          voluntaryReport.reporter_last_name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      <FieldRow label="Email" value={voluntaryReport.reporter_email} />
                      <FieldRow label="Teléfono" value={voluntaryReport.reporter_phone} />
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Row 2: Descripción + Consecuencias + Recomendaciones */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard icon={FileText} title="Descripción del Evento">
                <p className="pt-4 text-sm leading-relaxed text-foreground/90">
                  {voluntaryReport.description || "Sin descripción registrada."}
                </p>
              </SectionCard>

              <div className="space-y-4">
                <SectionCard icon={AlertTriangle} title="Posibles Consecuencias">
                  {voluntaryReport.possible_consequences ? (
                    <div className="pt-2">
                      {(Array.isArray(voluntaryReport.possible_consequences)
                        ? (voluntaryReport.possible_consequences as string[])
                        : (voluntaryReport.possible_consequences as string).split("~")
                      ).map(
                        (c, i) =>
                          c.trim() && (
                            <div
                              key={i}
                              className="flex items-start gap-2 border-b border-border/40 py-2 text-sm leading-relaxed last:border-b-0"
                            >
                              <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
                              <span>{c.trim()}</span>
                            </div>
                          ),
                      )}
                    </div>
                  ) : (
                    <p className="pt-4 text-sm text-muted-foreground">
                      Sin consecuencias registradas.
                    </p>
                  )}
                </SectionCard>

                <SectionCard icon={FileText} title="Recomendaciones">
                  <p className="pt-4 text-sm leading-relaxed text-foreground/90">
                    {voluntaryReport.recommendations || "Sin recomendaciones registradas."}
                  </p>
                </SectionCard>
              </div>
            </div>

            {/* Row 3: Attachments */}
            {(voluntaryReport.image || voluntaryReport.document) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {voluntaryReport.image && (
                  <SectionCard icon={Download} title="Imagen Adjunta">
                    <div className="space-y-3 pt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="group relative h-[220px] cursor-pointer overflow-hidden rounded-lg border transition-colors hover:border-sky-400">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt="Imagen del reporte"
                                className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Loader2 className="size-8 animate-spin text-sky-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-transparent transition-all group-hover:bg-black/35">
                              <span className="flex items-center gap-1.5 rounded-md bg-black/50 px-3.5 py-2 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <Maximize2 className="h-4 w-4" />
                                Ver imagen
                              </span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="font-mono">
                              RVP-{voluntaryReport.report_number} · Imagen
                            </DialogTitle>
                          </DialogHeader>
                          <div className="relative flex h-[60vh] items-center justify-center">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt="Imagen completa del reporte"
                                className="max-h-full max-w-full rounded-lg object-contain"
                              />
                            ) : (
                              <Loader2 className="size-10 animate-spin text-sky-500" />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() =>
                          downloadDocument(
                            voluntaryReport.image!,
                            `Imagen-RVP-${voluntaryReport.report_number || "adjunta"}.jpg`,
                          )
                        }
                        disabled={isDownloading}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Descargar imagen
                      </Button>
                    </div>
                  </SectionCard>
                )}

                {voluntaryReport.document && (
                  <SectionCard icon={File} title="Documento Adjunto">
                    <div className="pt-4">
                      <div className="mt-1 flex items-center gap-3.5 rounded-lg border border-dashed p-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <File className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            PDF
                          </p>
                          <p className="truncate font-mono text-sm font-medium">
                            RVP-{voluntaryReport.report_number}.pdf
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDownloading}
                          onClick={() =>
                            downloadDocument(
                              voluntaryReport.document!,
                              `RVP-${voluntaryReport.report_number}.pdf`,
                            )
                          }
                        >
                          {isDownloading ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {isDownloading ? "Descargando..." : "Descargar"}
                        </Button>
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <Card className="mt-4 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">Ha ocurrido un error al cargar el reporte voluntario.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ContentLayout>
  );
};

export default ShowVoluntaryReport;
