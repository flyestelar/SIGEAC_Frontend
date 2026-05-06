"use client";
import CreateDangerIdentificationDialog from "@/components/dialogs/sms/CreateDangerIdentificationDialog";
import CreateObligatoryDialog from "@/components/dialogs/sms/CreateObligatoryDialog";
import DeleteObligatoryReportDialog from "@/components/dialogs/sms/DeleteObligatoryReportDialog";
import PreviewObligatoryReportPdfDialog from "@/components/dialogs/sms/PreviewObligatoryReportPdfDialog";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGetObligatoryReportById } from "@/hooks/sms/useGetObligatoryReportById";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  File,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Paperclip,
  Plane,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCompanyStore } from "@/stores/CompanyStore";

/* ── Helpers ──────────────────────────────────────────────── */

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function Section({
  num,
  icon: Icon,
  title,
  children,
}: {
  num: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2 bg-muted/50 border-b border-border">
        <span className="text-[11px] font-semibold text-amber-500 tracking-[0.05em] min-w-[20px]">
          {num}
        </span>
        <Icon className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="p-4 bg-background">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | undefined }) {
  const cfg: Record<string, string> = {
    CERRADO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ABIERTO: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    PROCESO: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold tracking-wider uppercase",
        cfg[status ?? ""] ?? "border-border bg-muted text-muted-foreground",
      )}
    >
      {status ?? "—"}
    </span>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

const ShowObligatoryReport = () => {
  const { obligarory_id } = useParams<{ obligarory_id: string }>();
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();

  const { data: report, isLoading, isError } = useGetObligatoryReportById({
    company: selectedCompany?.slug ?? null,
    id: obligarory_id,
  });

  const resolveUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}${path}`;
  };

  const parseDate = (s: string | null | undefined) => {
    if (!s) return null;
    const d = new Date(s.replace(/-/g, "/"));
    return isNaN(d.getTime()) ? null : d;
  };

  const fmtDate = (s: string | null | undefined) => {
    const d = parseDate(s);
    return d ? format(d, "PPP", { locale: es }) : "—";
  };

  const isOpen = report?.status === "ABIERTO";
  const imageUrl = resolveUrl(report?.image);
  const docUrl = resolveUrl(report?.document);

  return (
    <ContentLayout title="Reporte Obligatorio de Suceso">

      {/* ── Top bar ── */}
      <div className="border border-border rounded-lg overflow-hidden mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">

          {/* Left: back + code + status */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${selectedCompany?.slug}/sms/reportes`)}
              className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </Button>
            <Separator orientation="vertical" className="h-4" />
            {report?.report_number ? (
              <span className="text-sm font-semibold text-foreground tracking-wide">
                ROS-{report.report_number}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">ROS-···</span>
            )}
            <StatusBadge status={report?.status} />
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {report && isOpen && !report.danger_identification && (
              <CreateDangerIdentificationDialog
                title="Identificar Peligro"
                id={report.id}
                reportType="ROS"
              />
            )}
            {report && isOpen && report.danger_identification?.id && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                <Link href={`/${selectedCompany?.slug}/sms/gestion_reportes/peligros_identificados/${report.danger_identification.id}`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Identificación
                </Link>
              </Button>
            )}
            {report && isOpen && (
              <CreateObligatoryDialog
                initialData={report}
                isEditing
                title="Editar"
              />
            )}
            {report && isOpen && (
              <DeleteObligatoryReportDialog
                company={selectedCompany!.slug}
                id={report.id.toString()}
              />
            )}
            {report && (
              <PreviewObligatoryReportPdfDialog
                title="Descargar PDF"
                obligatoryReport={report}
              />
            )}
          </div>
        </div>

        {/* Reference strip */}
        {report?.reference_number && (
          <div className="px-4 py-2 flex items-center gap-2 bg-background border-t border-border/50">
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
              Referencia
            </span>
            <span className="text-xs text-foreground">{report.reference_number}</span>
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            Ha ocurrido un error al cargar el reporte obligatorio.
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Main column ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* 01 Identificación */}
            <Section num="01" icon={FileText} title="Identificación">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FieldRow label="Código" value={`ROS-${report.report_number}`} />
                <FieldRow label="Estación" value={report.station} />
                <FieldRow label="Fecha del Reporte" value={fmtDate(report.report_date)} />
              </div>
            </Section>

            {/* 02 Ubicación */}
            <Section num="02" icon={MapPin} title="Ubicación del Incidente">
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Lugar" value={report.incident_location} />
                <FieldRow label="Especificación" value={report.incident_location_other} />
                <FieldRow label="Fecha del Incidente" value={fmtDate(report.incident_date)} />
                {report.danger_type && (
                  <FieldRow label="Tipo de Peligro" value={report.danger_type} />
                )}
              </div>
            </Section>

            {/* 03 Descripción */}
            <Section num="03" icon={FileText} title="Descripción del Suceso">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </Section>

            {/* 03b Otros incidentes */}
            {report.other_incidents && (
              <Section num="03b" icon={AlertCircle} title="Otros Incidentes">
                <p className="text-sm text-foreground leading-relaxed">
                  {report.other_incidents}
                </p>
              </Section>
            )}

            {/* 03c Lista de incidentes */}
            {Array.isArray(report.incidents) && report.incidents.length > 0 && (
              <Section num="03c" icon={AlertCircle} title="Lista de Incidentes">
                <ul className="space-y-1.5">
                  {(report.incidents as string[]).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-amber-500 text-xs font-semibold mt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 04 Datos del Reportero */}
            {(report.reporter_name || report.reporter_email || report.reporter_phone || report.reporter_area || report.reporter_position) && (
              <Section num="04" icon={User} title="Datos del Reportero">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <FieldRow label="Nombre" value={report.reporter_name} />
                  <FieldRow label="Correo" value={report.reporter_email} />
                  <FieldRow label="Teléfono" value={report.reporter_phone} />
                  <FieldRow label="Área" value={report.reporter_area} />
                  <FieldRow label="Cargo" value={report.reporter_position} />
                </div>
              </Section>
            )}
          </div>

          {/* ── Side column ── */}
          <div className="flex flex-col gap-4">

            {/* 05 Aeronave */}
            {report.aircraft && (
              <Section num="05" icon={Plane} title="Aeronave">
                <div className="flex flex-col gap-3">
                  <FieldRow label="Matrícula" value={report.aircraft.acronym} />
                  <FieldRow label="Modelo" value={report.aircraft.model} />
                </div>
              </Section>
            )}

            {/* 06 Tripulación */}
            {(report.pilot || report.copilot) && (
              <Section num="06" icon={Users} title="Tripulación">
                <div className="flex flex-col gap-4">
                  {report.pilot && (
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-amber-600 dark:text-amber-400 mb-2">
                        Piloto
                      </p>
                      <div className="flex flex-col gap-2">
                        <FieldRow
                          label="Nombre"
                          value={`${report.pilot.employee?.first_name ?? ""} ${report.pilot.employee?.last_name ?? ""}`.trim()}
                        />
                        <FieldRow label="DNI" value={report.pilot.employee?.dni} />
                        <FieldRow label="Licencia" value={report.pilot.license_number} />
                      </div>
                    </div>
                  )}
                  {report.pilot && report.copilot && (
                    <Separator />
                  )}
                  {report.copilot && (
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-amber-600 dark:text-amber-400 mb-2">
                        Copiloto
                      </p>
                      <div className="flex flex-col gap-2">
                        <FieldRow
                          label="Nombre"
                          value={`${report.copilot.employee?.first_name ?? ""} ${report.copilot.employee?.last_name ?? ""}`.trim()}
                        />
                        <FieldRow label="DNI" value={report.copilot.employee?.dni} />
                        <FieldRow label="Licencia" value={report.copilot.license_number} />
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* 07 Adjuntos */}
            {(imageUrl || docUrl) && (
              <Section num="07" icon={Paperclip} title="Archivos Adjuntos">
                <div className="flex flex-col gap-3">

                  {/* Image */}
                  {imageUrl && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="group relative w-full overflow-hidden rounded-md border border-border bg-muted/30 hover:border-amber-500/50 transition-colors">
                          <div className="relative h-40 w-full">
                            <Image
                              src={imageUrl}
                              alt={`Imagen ROS-${report.report_number}`}
                              fill
                              unoptimized
                              className="object-contain p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-md">
                              <span className="flex items-center gap-1.5 text-white text-xs font-medium bg-black/60 px-2.5 py-1.5 rounded">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Ver imagen
                              </span>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 border-t border-border bg-muted/50 flex items-center gap-1.5">
                            <ImageIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">Imagen adjunta</span>
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-sm">
                            <ImageIcon className="w-4 h-4 text-amber-500" />
                            ROS-{report.report_number} — Imagen
                          </DialogTitle>
                        </DialogHeader>
                        <div className="relative flex justify-center items-center h-[60vh]">
                          <Image
                            src={imageUrl}
                            alt={`Imagen ROS-${report.report_number}`}
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <a
                            href={imageUrl}
                            download={`ROS-${report.report_number}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted hover:bg-muted/80 text-xs font-medium transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar
                          </a>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Document */}
                  {docUrl && (
                    <a
                      href={docUrl}
                      download={`ROS-${report.report_number}.pdf`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-muted/30 hover:border-amber-500/50 hover:bg-muted/60 transition-colors group"
                    >
                      <File className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Documento PDF
                        </p>
                        <p className="text-xs text-foreground truncate">
                          ROS-{report.report_number}.pdf
                        </p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-600 transition-colors flex-shrink-0" />
                    </a>
                  )}
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </ContentLayout>
  );
};

export default ShowObligatoryReport;
