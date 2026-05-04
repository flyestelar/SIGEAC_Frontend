"use client";

import { useParams } from "next/navigation";
import { FileServer } from "@/components/misc/FileServer";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar,
    Clock,
    Download,
    File,
    FileText,
    Layers3,
    ShieldAlert,
    AlertTriangle,
    Activity,
} from "lucide-react";

import { ContentLayout } from "@/components/layout/ContentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBadgeStatusClass } from "@/lib/sms/utils";
import { cn } from "@/lib/utils";
import { DangerIdentification, Location, ObligatoryReport } from "@/types";
import {
    Analysis as MaintenanceAnalysis,
    FollowUpControl as MaintenanceFollowUpControl,
    HazardNotification as MaintenanceHazardNotification,
    MitigationMeasure as MaintenanceMitigationMeasure,
    MitigationPlan as MaintenanceMitigationPlan,
    VoluntaryReport as MaintenanceVoluntaryReport,
} from "@/types/sms/mantenimiento";

import { DetailGrid } from "../../_components/detail-grid";
import { DetailItem } from "../../_components/report-helpers";

type RiskAnalysisLike = Partial<MaintenanceAnalysis> & {
    hazard_notification?: number;
    mitigation_plan_id?: number;
};

type FollowUpControlLike = Partial<MaintenanceFollowUpControl> & {
    date?: string | Date;
    mitigation_measure_id?: number | string;
};

type MitigationMeasureLike = Partial<MaintenanceMitigationMeasure> & {
    estimated_date?: string | Date;
    execution_date?: string | Date | null;
    follow_up_controls?: FollowUpControlLike[];
    follow_up_control?: FollowUpControlLike[];
};

type MitigationPlanLike = Partial<MaintenanceMitigationPlan> & {
    responsible?: string;
    start_date?: string | Date;
    measures?: MitigationMeasureLike[];
    analysis?: RiskAnalysisLike | null;
};

type HazardNotificationLike = Partial<MaintenanceHazardNotification> &
    Partial<DangerIdentification> & {
        location?: Location | null;
        mitigation_plan?: MitigationPlanLike | null;
        analysis?: RiskAnalysisLike | null;
    };

type ReportBaseLike = {
    id: number;
    report_number?: string | null;
    status: string;
    report_date: string | Date;
    imageUrl?: string | null;
    documentUrl?: string | null;
    hazard_notification?: unknown;
    danger_identification?: unknown;
};

type VoluntaryReportView = ReportBaseLike &
    Partial<MaintenanceVoluntaryReport> & {
        identification_date?: string | Date;
        location?: Location | null;
        identification_area?: string;
        danger_location?: string;
        danger_area?: string;
        airport_location?: string;
        danger_identification_id?: number | null;
        reporter_name?: string;
        reporter_last_name?: string;
        reporter_phone?: string;
        reporter_email?: string;
        description: string;
        possible_consequences: string;
    };

type ObligatoryReportView = ObligatoryReport & ReportBaseLike;

type ReportDetailViewProps =
    | {
        kind: "RVP";
        report: VoluntaryReportView | null;
        backHref: string;
        title: string;
    }
    | {
        kind: "ROS";
        report: ObligatoryReportView | null;
        backHref: string;
        title: string;
    };

const formatDisplayDate = (value?: string | Date | null) =>
    value
        ? (() => {
            const date = value instanceof Date ? value : new Date(value);
            return Number.isNaN(date.getTime()) ? "N/A" : format(date, "PPP", { locale: es });
        })()
        : "N/A";

const formatLocationLabel = (location?: Location | null) =>
    [location?.cod_iata, location?.name, location?.address].filter(Boolean).join(" - ");

// Helper: safe getter for multiple possible keys (snake_case / camelCase / no underscore)
const getAny = (obj: any, ...keys: string[]) => {
    if (!obj) return undefined;
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
};

// Normalize controls accepting many API shapes
const normalizeControls = (measure?: MitigationMeasureLike | null): FollowUpControlLike[] =>
    (getAny(
        measure,
        "follow_up_controls",
        "follow_up_control",
        "followupcontrols",
        "followup_controls",
        "followupControl",
        "followup_control",
    ) ?? []) as FollowUpControlLike[];

// Normalize a raw hazard notification / danger identification object coming from API
const normalizeHazardNotification = (raw: any): HazardNotificationLike | null => {
    if (!raw) return null;

    const informationSource = getAny(raw, "information_source", "informationsource", "informationSource");
    const location = getAny(raw, "location", "location_id") as Location | undefined;
    const mitigation = getAny(raw, "mitigation_plan", "mitigationplan", "mitigationPlan");

    // Normalize measures and follow-up controls inside mitigation plan
    const normalizedMitigation: MitigationPlanLike | null = mitigation
        ? {
            ...mitigation,
            measures: (mitigation.measures ?? mitigation.Measures ?? mitigation.measures_list ?? [])
                .map((m: any) => ({
                    ...m,
                    // ensure follow_up_controls key variants are accessible via the expected names
                    follow_up_controls:
                        getAny(m, "follow_up_controls", "follow_up_control", "followupcontrols", "followup_controls") ?? [],
                    follow_up_control:
                        getAny(m, "follow_up_control", "follow_up_controls", "followupcontrols", "followup_controls") ?? [],
                })) as MitigationMeasureLike[],
        }
        : null;

    const normalized: HazardNotificationLike = {
        id: getAny(raw, "id"),
        report_number: getAny(raw, "report_number", "reportNumber"),
        reception_date: getAny(raw, "reception_date", "receptionDate"),
        location: location || null,
        identification_area: getAny(raw, "identification_area", "identificationArea"),
        danger_type: getAny(raw, "danger_type", "dangerType", "danger"),
        information_source: informationSource ?? null,
        description: getAny(raw, "description"),
        analysis_of_root_causes: getAny(raw, "analysis_of_root_causes", "analysisOfRootCauses", "analysis_of_root_cause", "analysis"),
        report_type: getAny(raw, "report_type", "reportType"),
        voluntary_report: getAny(raw, "voluntary_report", "voluntaryreport", "voluntaryReport") ?? undefined,
        obligatory_report: getAny(raw, "obligatory_report", "obligatoryreport", "obligatoryReport") ?? undefined,
        mitigation_plan: normalizedMitigation,
        analysis: getAny(raw, "analysis") ?? null,
        // keep any additional fields that existing UI may reference
        current_defenses: getAny(raw, "current_defenses", "currentDefenses", "defensas_actuales", "defensasActuales") as any,
        possible_consequences: getAny(raw, "possible_consequences", "possibleConsequences"),
        consequence_to_evaluate: getAny(raw, "consequence_to_evaluate", "consequenceToEvaluate"),
    } as HazardNotificationLike;

    return normalized;
};

// Extract hazard notification from report accepting multiple possible keys
const getHazardNotification = (report: ReportBaseLike | null) => {
    if (!report) return null;
    const raw = getAny(report, "hazard_notification", "hazardnotification", "danger_identification", "dangeridentification", "dangerIdentification");
    return normalizeHazardNotification(raw);
};

const getSeverityBadgeClass = (severity?: string) => {
    const s = String(severity ?? "").toLowerCase();
    if (s.includes("alto") || s.includes("high")) return "bg-red-600 text-white";
    if (s.includes("medio") || s.includes("medium") || s.includes("med")) return "bg-amber-400 text-black";
    if (s.includes("bajo") || s.includes("low")) return "bg-emerald-600 text-white";
    return "bg-gray-200 text-gray-800";
};

const getProbabilityBadgeClass = (prob?: string | number) => {
    const p = String(prob ?? "").toLowerCase();
    const n = Number(p);
    if (p.includes("alta") || p.includes("high") || (!Number.isNaN(n) && n >= 70)) return "bg-red-600 text-white";
    if (p.includes("media") || p.includes("medium") || (!Number.isNaN(n) && n >= 40 && n < 70)) return "bg-amber-400 text-black";
    if (p.includes("baja") || p.includes("low") || (!Number.isNaN(n) && n < 40)) return "bg-emerald-600 text-white";
    return "bg-gray-200 text-gray-800";
};

const buildAnalysisDetails = (analysis?: RiskAnalysisLike | null): DetailItem[] => [
    { label: "Probabilidad", value: analysis?.probability || "N/A" },
    { label: "Severidad", value: analysis?.severity || "N/A" },
    { label: "Resultado", value: analysis?.result || "N/A" },
    { label: "Tipo", value: analysis?.type || "N/A" },
];

const getReportCode = (report: { id: number; report_number?: string | null }, type: "RVP" | "ROS") => {
    const prefix = type === "RVP" ? "RVP" : "ROS";
    return report.report_number ? `${prefix}-${report.report_number}` : `${prefix}-${report.id}`;
};

const buildVoluntaryDetails = (report: VoluntaryReportView): DetailItem[] => [
    { label: "Codigo", value: getReportCode(report, "RVP") },
    { label: "Fecha del reporte", value: formatDisplayDate(report.report_date) },
    { label: "Fecha de identificacion", value: formatDisplayDate(report.identification_date) },
    { label: "Estado", value: report.status },
    { label: "Lugar del peligro", value: report.danger_location || formatLocationLabel(report.location) },
    { label: "Area del peligro", value: report.danger_area || report.identification_area },
    { label: "Ubicacion del aeropuerto", value: report.airport_location || "N/A" },
    { label: "Identificacion vinculada", value: report.danger_identification_id ?? "N/A" },
    { label: "Nombre", value: report.reporter_name || "N/A" },
    { label: "Apellido", value: report.reporter_last_name || "N/A" },
    { label: "Telefono", value: report.reporter_phone || "N/A" },
    { label: "Correo", value: report.reporter_email || "N/A" },
    {
        label: "Descripcion",
        value: report.description,
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Posibles consecuencias",
        value: report.possible_consequences,
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
];

const buildObligatoryDetails = (report: ObligatoryReportView): DetailItem[] => [
    { label: "Codigo", value: getReportCode(report, "ROS") },
    { label: "Fecha del reporte", value: formatDisplayDate(report.report_date) },
    { label: "Estado", value: report.status },
    { label: "Fecha del incidente", value: formatDisplayDate(report.incident_date) },
    { label: "Hora del incidente", value: report.incident_time || "N/A" },
    { label: "Tiempo de vuelo", value: report.flight_time || "N/A" },
    { label: "Numero de vuelo", value: report.flight_number },
    { label: "Origen", value: report.flight_origin },
    { label: "Destino", value: report.flight_destiny },
    { label: "Destino alterno", value: report.flight_alt_destiny },
    { label: "Lugar del incidente", value: report.incident_location },
    {
        label: "Incidentes",
        value: report.incidents || "Sin incidentes registrados",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Otros incidentes",
        value: report.other_incidents || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Descripcion",
        value: report.description,
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
];

const buildCrewAndAircraftDetails = (report: ObligatoryReportView): DetailItem[] => [
    { label: "Piloto", value: report.pilot?.employee_dni || "N/A" },
    { label: "Licencia piloto", value: report.pilot?.license_number || "N/A" },
    { label: "Copiloto", value: report.copilot?.employee_dni || "N/A" },
    { label: "Licencia copiloto", value: report.copilot?.license_number || "N/A" },
    { label: "Aeronave", value: report.aircraft?.acronym || "N/A" },
    { label: "Marca", value: report.aircraft?.brand || "N/A" },
    { label: "Modelo", value: report.aircraft?.model || "N/A" },
    { label: "Serial", value: report.aircraft?.serial || "N/A" },
    { label: "Estado aeronave", value: report.aircraft?.status || "N/A" },
];

const buildDangerIdentificationDetails = (notification: HazardNotificationLike): DetailItem[] => [
    { label: "Codigo", value: notification.report_number ?? notification.id ?? "N/A" },
    {
        label: "Fecha de recepcion",
        value: formatDisplayDate(notification.reception_date || notification.risk_management_start_date),
    },
    { label: "Tipo de reporte", value: notification.report_type || "N/A" },
    { label: "Peligro", value: notification.danger || notification.danger_type || "N/A" },
    { label: "Area", value: notification.identification_area || notification.danger_area || "N/A" },
    { label: "Ubicacion", value: notification.location ? formatLocationLabel(notification.location) : "N/A" },
    { label: "Fuente de informacion", value: notification.information_source?.name || "N/A" },
    {
        label: "Defensas actuales",
        value: notification.current_defenses,
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Descripcion",
        value: notification.description,
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Analisis de causas raiz",
        value: notification.analysis_of_root_causes || notification.root_cause_analysis,
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Posibles consecuencias",
        value: notification.possible_consequences || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Consecuencia a evaluar",
        value: notification.consequence_to_evaluate || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    { label: "Fecha de gestion", value: formatDisplayDate(notification.risk_management_start_date) },
];

const buildMitigationPlanDetails = (plan: MitigationPlanLike): DetailItem[] => [
    { label: "Codigo", value: plan.id ?? "N/A" },
    { label: "Area responsable", value: plan.area_responsible || plan.responsible || "N/A" },
    { label: "Fecha de inicio", value: formatDisplayDate(plan.start_date) },
    {
        label: "Posibles consecuencias",
        value: plan.possible_consequences || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Consecuencia a evaluar",
        value: plan.consequence_to_evaluate || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Descripcion",
        value: plan.description || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
];

const buildMeasureDetails = (measure: MitigationMeasureLike): DetailItem[] => [
    { label: "Codigo", value: measure.id ?? "N/A" },
    {
        label: "Descripcion",
        value: measure.description || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    {
        label: "Supervisor de implementacion",
        value: measure.implementation_supervisor || "N/A",
    },
    {
        label: "Responsable de implementacion",
        value: measure.implementation_responsible || "N/A",
    },
    { label: "Fecha estimada", value: formatDisplayDate(measure.estimated_date) },
    { label: "Fecha de ejecucion", value: formatDisplayDate(measure.execution_date) },
];

const buildControlDetails = (control: FollowUpControlLike): DetailItem[] => [
    { label: "Codigo", value: control.id ?? "N/A" },
    { label: "Fecha", value: formatDisplayDate(control.date) },
    {
        label: "Descripcion",
        value: control.description || "N/A",
        fullWidth: true,
        contentClassName: "whitespace-pre-wrap",
    },
    { label: "Imagen", value: control.image || "N/A" },
    { label: "Documento", value: control.document || "N/A" },
];

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
    } catch (error) {
        console.error("Error downloading image:", error);
        // Fallback: open in a new tab if fetch fails due to CORS
        window.open(url, "_blank");
    }
};

export function ReportDetailView({ kind, report, backHref, title }: ReportDetailViewProps) {
    const details = report
        ? kind === "RVP"
            ? buildVoluntaryDetails(report)
            : buildObligatoryDetails(report)
        : [];

    const { company } = useParams<{ company: string }>();

    const reportTime =
        kind === "ROS" && report ? (report as { report_time?: string }).report_time ?? null : null;
    const reportNotification = getHazardNotification(report);
    const mitigationPlan = reportNotification?.mitigation_plan ?? null;
    const planAnalysis = mitigationPlan?.analysis ?? reportNotification?.analysis ?? null;

    return (
        <ContentLayout title={title}>
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                        {kind === "RVP" ? "Reporte voluntario" : "Reporte obligatorio"}
                    </p>
                    <h1 className="text-2xl font-semibold">
                        {report ? getReportCode(report, kind) : "Cargando..."}
                    </h1>
                </div>

                <Button asChild variant="outline">
                    <Link href={backHref}>Volver</Link>
                </Button>
            </div>

            {!report ? (
                <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                        No se encontró el reporte solicitado.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-5 w-5" />
                                    Información general
                                </CardTitle>
                                <Badge className={cn("border", getBadgeStatusClass(report.status))}>
                                    {report.status}
                                </Badge>
                            </div>
                            <CardDescription className="flex flex-wrap gap-4 text-sm">
                                <span className="inline-flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDisplayDate(report.report_date)}
                                </span>
                                {reportTime ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {String(reportTime)}
                                    </span>
                                ) : null}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DetailGrid items={details} />
                        </CardContent>
                    </Card>

                    {kind === "ROS" ? (
                        <Card>
                            <CardHeader className="space-y-2">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-5 w-5" />
                                    Vuelo y aeronave
                                </CardTitle>
                                <CardDescription>Tripulación y aeronave asociadas al reporte.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DetailGrid items={buildCrewAndAircraftDetails(report)} />
                            </CardContent>
                        </Card>
                    ) : null}

                    {reportNotification ? (
                        <Card>
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <ShieldAlert className="h-5 w-5" />
                                        Notificación de peligro
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        {reportNotification.danger_type ? (
                                            <Badge className="uppercase text-xs">{String(reportNotification.danger_type)}</Badge>
                                        ) : null}
                                        {reportNotification.information_source?.type ? (
                                            <Badge variant="outline" className="text-xs">
                                                {String(reportNotification.information_source.type)}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                                <CardDescription className="flex flex-wrap gap-4 text-sm">
                                    <span className="inline-flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formatDisplayDate(reportNotification.reception_date)}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="text-sm">Fuente:</span> {reportNotification.information_source?.name ?? "N/A"}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DetailGrid items={buildDangerIdentificationDetails(reportNotification)} />
                            </CardContent>
                        </Card>
                    ) : null}

                    {mitigationPlan ? (
                        <Card>
                            <CardHeader className="space-y-2">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Layers3 className="h-5 w-5" />
                                    Plan de mitigación
                                </CardTitle>
                                <CardDescription>Medidas, análisis y controles de seguimiento asociados.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <DetailGrid items={buildMitigationPlanDetails(mitigationPlan)} />

                                {planAnalysis ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                Análisis de riesgo
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs", getProbabilityBadgeClass(String(planAnalysis.probability)))}>
                                                    <Activity className="h-4 w-4" />
                                                    {String(planAnalysis.probability)}
                                                </span>
                                                <span className={cn("inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs", getSeverityBadgeClass(planAnalysis.severity))}>
                                                    <AlertTriangle className="h-4 w-4" />
                                                    {String(planAnalysis.severity ?? "N/A")}
                                                </span>
                                                {planAnalysis.result ? (
                                                    <Badge className="text-xs">{String(planAnalysis.result)}</Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                        <DetailGrid items={buildAnalysisDetails(planAnalysis)} />
                                    </div>
                                ) : null}

                                {mitigationPlan.measures?.length ? (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Medidas
                                        </h3>
                                        <div className="space-y-4">
                                            {mitigationPlan.measures.map((measure, index) => {
                                                const controls = normalizeControls(measure);

                                                return (
                                                    <Card key={measure.id ?? `${index}-${measure.description ?? "measure"}`} className="border-dashed">
                                                        <CardHeader className="space-y-2">
                                                            <CardTitle className="text-lg">
                                                                Medida {index + 1}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {measure.description || "Medida de mitigación sin descripción"}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-6">
                                                            <DetailGrid items={buildMeasureDetails(measure)} />

                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                                                    Controles de seguimiento
                                                                </h4>


                                                                {controls.length ? (
                                                                    <div className="space-y-3">
                                                                        {controls.map((control, controlIndex) => (
                                                                            <Card
                                                                                key={control.id ?? `${index}-${controlIndex}-${control.description ?? "control"}`}
                                                                                className="bg-muted/30"
                                                                            >
                                                                                <CardHeader className="space-y-1 pb-3">
                                                                                    <CardTitle className="text-base">
                                                                                        Control {controlIndex + 1}
                                                                                    </CardTitle>
                                                                                    <CardDescription>
                                                                                        {control.description || "Control de seguimiento sin descripción"}
                                                                                    </CardDescription>
                                                                                </CardHeader>
                                                                                <CardContent className="space-y-4">
                                                                                    {/* Información básica del control */}
                                                                                    <DetailGrid items={buildControlDetails(control)} />

                                                                                    {/* Mostrar imagen si existe */}
                                                                                    {control.image && (
                                                                                        <div className="space-y-2">
                                                                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                                                                Imagen del control
                                                                                            </h4>
                                                                                            <FileServer
                                                                                                path={control.image}
                                                                                                company={company}
                                                                                                type="file"
                                                                                            >
                                                                                                {(url, isLoading, hasError) => (
                                                                                                    <div className="space-y-3">
                                                                                                        <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                                                                                                            {isLoading && (
                                                                                                                <p className="text-sm text-muted-foreground">
                                                                                                                    Cargando imagen...
                                                                                                                </p>
                                                                                                            )}

                                                                                                            {hasError && (
                                                                                                                <p className="text-sm text-destructive">
                                                                                                                    Error al cargar la imagen
                                                                                                                </p>
                                                                                                            )}

                                                                                                            {!isLoading && !hasError && url && (
                                                                                                                <img
                                                                                                                    src={url}
                                                                                                                    alt={`Imagen control ${controlIndex + 1}`}
                                                                                                                    className="object-contain w-full h-full"
                                                                                                                />
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {url && (
                                                                                                            <Button
                                                                                                                variant="outline"
                                                                                                                size="sm"
                                                                                                                onClick={() => {
                                                                                                                    handleDownloadImage(
                                                                                                                        control.image!,
                                                                                                                        `Control-${control.id || controlIndex + 1}-imagen.jpg`
                                                                                                                    );
                                                                                                                }}
                                                                                                            >
                                                                                                                <Download className="w-4 h-4 mr-2" />
                                                                                                                Descargar Imagen
                                                                                                            </Button>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </FileServer>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Mostrar documento si existe */}
                                                                                    {control.document && (
                                                                                        <div className="space-y-2">
                                                                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                                                                Documento del control
                                                                                            </h4>
                                                                                            <FileServer
                                                                                                path={control.document}
                                                                                                company={company}
                                                                                                type="file"
                                                                                            >
                                                                                                {(url, isLoading, hasError) => (
                                                                                                    <div className="space-y-3">
                                                                                                        <div className="relative overflow-hidden rounded-lg border bg-muted flex items-center justify-center min-h-[100px]">
                                                                                                            {isLoading && (
                                                                                                                <p className="text-sm text-muted-foreground">
                                                                                                                    Cargando documento...
                                                                                                                </p>
                                                                                                            )}

                                                                                                            {hasError && (
                                                                                                                <p className="text-sm text-destructive">
                                                                                                                    Error al cargar el documento
                                                                                                                </p>
                                                                                                            )}

                                                                                                            {!isLoading && !hasError && url && (
                                                                                                                <div className="flex flex-col items-center gap-2 p-4">
                                                                                                                    <File className="h-8 w-8 text-muted-foreground" />
                                                                                                                    <p className="text-sm text-muted-foreground">
                                                                                                                        Documento disponible
                                                                                                                    </p>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {url && (
                                                                                                            <Button
                                                                                                                variant="outline"
                                                                                                                size="sm"
                                                                                                                onClick={() => window.open(url, "_blank")}
                                                                                                                className="w-full"
                                                                                                            >
                                                                                                                <Download className="w-4 h-4 mr-2" />
                                                                                                                Ver Documento
                                                                                                            </Button>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </FileServer>
                                                                                        </div>
                                                                                    )}
                                                                                </CardContent>
                                                                            </Card>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        No hay controles de seguimiento registrados para esta medida.
                                                                    </p>
                                                                )}                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No hay medidas registradas para este plan.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {report.image && (
                            <Card>
                                <CardHeader className="space-y-2">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <File className="h-5 w-5" />
                                        Archivo adjunto
                                    </CardTitle>
                                    <CardDescription>Vista previa del archivo cargado.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Aquí usas el componente que definiste */}
                                    <FileServer path={String(report.image)} company={company} type="file">
                                        {(url, isLoading, hasError) => (
                                            <>
                                                <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                                                    {isLoading && <p>Cargando archivo...</p>}

                                                    {hasError || (!url && !isLoading) ? (
                                                        <p className="text-destructive">Error al cargar el archivo.</p>
                                                    ) : (
                                                        url && (
                                                            <img
                                                                src={url}
                                                                alt="Vista previa"
                                                                className="object-contain w-full h-full"
                                                            />
                                                        )
                                                    )}
                                                </div>

                                                {url && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (!report?.image) return;
                                                            handleDownloadImage(
                                                                report.image,
                                                                `Imagen-RVP-${report.id || "adjunta"}.jpg`,
                                                            );
                                                        }}
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Descargar Imagen
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </FileServer>
                                </CardContent>
                            </Card>
                        )}
                        {report.documentUrl ? (
                            <Card>
                                <CardHeader className="space-y-2">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <File className="h-5 w-5" />
                                        Documento adjunto
                                    </CardTitle>
                                    <CardDescription>Archivo asociado al reporte para consulta o descarga.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" className="w-full">
                                        <a href={report.documentUrl} target="_blank" rel="noreferrer">
                                            Abrir documento
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            )}
        </ContentLayout>
    );
}
