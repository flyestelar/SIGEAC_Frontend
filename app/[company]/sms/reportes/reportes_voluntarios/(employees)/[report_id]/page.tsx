"use client";
import CreateDangerIdentificationDialog from "@/components/dialogs/sms/CreateDangerIdentificationDialog";
import CreateVoluntaryReportDialog from "@/components/dialogs/sms/CreateVoluntaryReportDialog";
import DeleteVoluntaryReportDialog from "@/components/dialogs/sms/DeleteVoluntaryReportDialog";
import PreviewVoluntaryReportPdfDialog from "@/components/dialogs/sms/PreviewVoluntaryReportPdfDialog";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  File,
  Download,
  CalendarCheck,
  ArrowLeft,
  Maximize2,
  Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

/* ─── helpers ─── */
const formatFriendly = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  const soloFecha = dateString.split(" ")[0];
  const [year, month, day] = soloFecha.split("-");
  return `${day}-${month}-${year}`;
};

/* ─── sub-components ─── */
function FieldRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="rvp-field">
      <span className="rvp-label">{label}</span>
      <span className={mono ? "rvp-value-mono" : "rvp-value"}>{value || "—"}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="rvp-card">
      <div className="rvp-card-header">
        <Icon className="w-4 h-4" />
        <span>{title}</span>
      </div>
      <CardContent className="pt-0 px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

/* ─── page ─── */
const ShowVoluntaryReport = () => {
  const { report_id } = useParams<{ report_id: string }>();
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();

  const { data: voluntaryReport, isLoading, isError } = useGetVoluntaryReportById({
    id: report_id,
    company: selectedCompany?.slug,
  });

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const isClosed = voluntaryReport?.status === "CERRADO";
  const statusColor = isClosed ? "#16a34a" : "#dc2626";
  const statusBg   = isClosed ? "#f0fdf4" : "#fef2f2";

  return (
    <ContentLayout title="">
      {/* ── fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Sora:wght@300;400;500;600;700&display=swap');

        .rvp-root { font-family: 'Sora', sans-serif; }

        /* header */
        .rvp-header {
          background: #0f172a;
          border-radius: 12px;
          padding: 28px 32px 24px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .rvp-report-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .rvp-report-number {
          font-family: 'IBM Plex Mono', monospace;
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 600;
          color: #f1f5f9;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .rvp-report-number span { color: #38bdf8; }
        .rvp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 10px;
          font-family: 'IBM Plex Mono', monospace;
          border: 1px solid;
        }
        .rvp-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }
        .rvp-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .rvp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500;
          color: #94a3b8; cursor: pointer;
          background: none; border: none; padding: 0;
          font-family: 'Sora', sans-serif;
          transition: color 0.15s;
          margin-bottom: 16px;
        }
        .rvp-back:hover { color: #f1f5f9; }

        /* cards */
        .rvp-card {
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          background: hsl(var(--card));
          overflow: hidden;
        }
        .rvp-card-header {
          display: flex; align-items: center; gap-8px: 8px;
          gap: 8px;
          padding: 14px 20px;
          border-bottom: 1px solid hsl(var(--border));
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: hsl(var(--muted-foreground));
        }

        /* fields */
        .rvp-field {
          display: flex; flex-direction: column;
          gap: 2px;
          padding: 12px 0;
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }
        .rvp-field:last-child { border-bottom: none; padding-bottom: 0; }
        .rvp-field:first-child { padding-top: 0; }
        .rvp-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
        }
        .rvp-value {
          font-size: 14px;
          font-weight: 500;
          color: hsl(var(--foreground));
          line-height: 1.5;
        }
        .rvp-value-mono {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        /* consequences list */
        .rvp-consequence {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid hsl(var(--border) / 0.4);
          font-size: 14px;
          line-height: 1.5;
        }
        .rvp-consequence:last-child { border-bottom: none; }
        .rvp-chevron { flex-shrink: 0; color: #38bdf8; margin-top: 3px; }

        /* attachment */
        .rvp-image-thumb {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid hsl(var(--border));
          height: 220px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .rvp-image-thumb:hover { border-color: #38bdf8; }
        .rvp-image-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .rvp-image-thumb:hover .rvp-image-overlay { background: rgba(0,0,0,0.35); }
        .rvp-overlay-label {
          display: flex; align-items: center; gap: 6px;
          color: white;
          font-size: 13px; font-weight: 600;
          opacity: 0; transition: opacity 0.2s;
          background: rgba(0,0,0,0.5);
          padding: 8px 14px; border-radius: 6px;
        }
        .rvp-image-thumb:hover .rvp-overlay-label { opacity: 1; }

        /* doc download */
        .rvp-doc-zone {
          display: flex; align-items: center; gap: 14px;
          padding: 16px;
          border: 1px dashed hsl(var(--border));
          border-radius: 8px;
          margin-top: 4px;
        }
        .rvp-doc-icon {
          width: 40px; height: 40px;
          background: #f1f5f9;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dark .rvp-doc-icon { background: #1e293b; }

        /* anon badge */
        .rvp-anon {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px;
          background: hsl(var(--muted));
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }

        /* close info strip */
        .rvp-close-strip {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          margin-top: 12px;
        }
        .dark .rvp-close-strip { background: #052e16; border-color: #166534; }
        .rvp-close-strip-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #15803d; }
        .dark .rvp-close-strip-label { color: #4ade80; }
        .rvp-close-strip-value { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 600; color: #166534; }
        .dark .rvp-close-strip-value { color: #86efac; }
      `}</style>

      <div className="rvp-root max-w-6xl mx-auto">

        {/* ── Back ── */}
        <button
          className="rvp-back"
          onClick={() => router.push(`/${selectedCompany?.slug}/sms/reportes`)}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a reportes
        </button>

        {/* ── Header ── */}
        <div className="rvp-header">
          <div>
            <p className="rvp-report-label">Reporte Voluntario de Peligro</p>
            <p className="rvp-report-number">
              <span>RVP</span>-{voluntaryReport?.report_number ?? "···"}
            </p>
            {voluntaryReport && (
              <span
                className="rvp-status-pill"
                style={{ color: statusColor, background: statusBg, borderColor: statusColor + "55" }}
              >
                <span className="rvp-status-dot" style={{ background: statusColor }} />
                {voluntaryReport.status}
              </span>
            )}
          </div>

          {/* Actions */}
          {voluntaryReport && (
            <div className="rvp-actions">
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
                        <Shield className="w-4 h-4 mr-1.5" />
                        Ver Peligro
                      </Link>
                    </Button>
                  )}
                  <CreateVoluntaryReportDialog initialData={voluntaryReport} isEditing title="Editar" />
                  <DeleteVoluntaryReportDialog company={selectedCompany!.slug} id={voluntaryReport.id.toString()} />
                </>
              )}
              <PreviewVoluntaryReportPdfDialog title="Descargar PDF" voluntaryReport={voluntaryReport} />
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-7 h-7 animate-spin text-sky-500" />
          </div>
        )}

        {/* ── Content ── */}
        {voluntaryReport && (
          <div className="space-y-4">

            {/* Row 1: Información General + Ubicación + Fecha */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

              {/* General */}
              <SectionCard icon={FileText} title="Información General">
                <div className="pt-4 space-y-0">
                  <FieldRow label="N° Reporte" value={voluntaryReport.report_number ? `RVP-${voluntaryReport.report_number}` : undefined} mono />
                  <FieldRow
                    label="Fecha del Reporte"
                    value={voluntaryReport.report_date
                      ? format(new Date(voluntaryReport.report_date.replace(/-/g, "/")), "PPP", { locale: es })
                      : undefined}
                  />
                  <FieldRow
                    label="Fecha de Identificación"
                    value={dateFormat(voluntaryReport.identification_date || "", "PPP")}
                  />
                  {isClosed && voluntaryReport.close_date && (
                    <div className="rvp-close-strip">
                      <CalendarCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="rvp-close-strip-label">Fecha de Cierre</p>
                        <p className="rvp-close-strip-value">{formatFriendly(voluntaryReport.close_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Ubicación */}
              <SectionCard icon={MapPin} title="Ubicación del Peligro">
                <div className="pt-4 space-y-0">
                  <FieldRow label="Área de Identificación" value={voluntaryReport.finding_location} />
                  <FieldRow label="Estación" value={voluntaryReport.station} />
                  <FieldRow label="Localización Específica" value={voluntaryReport.finding_location_other} />
                </div>
              </SectionCard>

              {/* Reporter */}
              <SectionCard icon={User} title="Información del Reportero">
                <div className="pt-4">
                  {voluntaryReport.is_anonymous ? (
                    <div className="flex items-center h-full pt-2">
                      <span className="rvp-anon">
                        <User className="w-3.5 h-3.5" />
                        Reporte Anónimo
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      <FieldRow
                        label="Nombre"
                        value={[voluntaryReport.reporter_name, voluntaryReport.reporter_last_name].filter(Boolean).join(" ")}
                      />
                      <FieldRow label="Email" value={voluntaryReport.reporter_email} />
                      <FieldRow label="Teléfono" value={voluntaryReport.reporter_phone} />
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Row 2: Descripción + Consecuencias + Recomendaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <SectionCard icon={FileText} title="Descripción del Evento">
                <p className="pt-4 text-sm leading-relaxed text-foreground/90">
                  {voluntaryReport.description || "Sin descripción registrada."}
                </p>
              </SectionCard>

              <div className="space-y-4">
                <SectionCard icon={AlertTriangle} title="Posibles Consecuencias">
                  {voluntaryReport.possible_consequences ? (
                    <div className="pt-2">
                      {voluntaryReport.possible_consequences.split(",").map(
                        (c, i) => c.trim() && (
                          <div key={i} className="rvp-consequence">
                            <ChevronRight className="rvp-chevron w-4 h-4" />
                            <span>{c.trim()}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="pt-4 text-sm text-muted-foreground">Sin consecuencias registradas.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {voluntaryReport.image && (
                  <SectionCard icon={Download} title="Imagen Adjunta">
                    <div className="pt-4 space-y-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="rvp-image-thumb">
                            <Image
                              src={voluntaryReport.image!}
                              alt="Imagen del reporte"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                            <div className="rvp-image-overlay">
                              <span className="rvp-overlay-label">
                                <Maximize2 className="w-4 h-4" />
                                Ver imagen
                              </span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw]">
                          <DialogHeader>
                            <DialogTitle className="font-mono">RVP-{voluntaryReport.report_number} · Imagen</DialogTitle>
                          </DialogHeader>
                          <div className="relative h-[60vh]">
                            <Image
                              src={voluntaryReport.image!}
                              alt="Imagen completa del reporte"
                              fill
                              unoptimized
                              className="object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleDownloadImage(
                          voluntaryReport.image!,
                          `Imagen-RVP-${voluntaryReport.report_number || "adjunta"}.jpg`
                        )}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Descargar imagen
                      </Button>
                    </div>
                  </SectionCard>
                )}

                {voluntaryReport.document && (
                  <SectionCard icon={File} title="Documento Adjunto">
                    <div className="pt-4">
                      <div className="rvp-doc-zone">
                        <div className="rvp-doc-icon">
                          <File className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">PDF</p>
                          <p className="text-sm font-mono font-medium truncate">
                            RVP-{voluntaryReport.report_number}.pdf
                          </p>
                        </div>
                        <a
                          href={voluntaryReport.document!}
                          download={`RVP-${voluntaryReport.report_number}.pdf`}
                        >
                          <Button variant="outline" size="sm">
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Descargar
                          </Button>
                        </a>
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
          <Card className="border-red-200 mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
