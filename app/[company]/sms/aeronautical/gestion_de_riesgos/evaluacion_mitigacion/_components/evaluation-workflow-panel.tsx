import { useEffect, useState } from 'react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    FileStack,
    FileText,
    PencilLine,
    Plus,
    ShieldCheck,
} from 'lucide-react';

import CreateFollowUpControl from '@/components/forms/mantenimiento/sms/CreateFollowUpControl';
import CreateMitigationMeasure from '@/components/forms/mantenimiento/sms/CreateMitigationMeasure';
import CreateMitigationPlanAnalysis from '@/components/forms/mantenimiento/sms/CreateMitigationPlanAnalysis';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDate } from '@/lib/utils';
import {
    Analysis,
    FollowUpControl,
    HazardNotification,
    MitigationMeasure,
    MitigationPlan,
    RiskAssessment,
} from '@/types/sms/mantenimiento';

import { RiskAssessmentForm } from './risk-assessment-form';
import {
    getMeasureControls,
    getNotificationSource,
    getWorkflowStatus,
} from './workflow-helpers';

const StepBadge = ({
    step,
    title,
    completed,
}: {
    step: number;
    title: string;
    completed: boolean;
}) => (
    <div
        className={cn(
            'flex min-w-0 items-center gap-3 rounded-lg border px-4 py-3',
            completed
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40'
                : 'border-border bg-muted/30'
        )}
    >
        <div
            className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                completed
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                    : 'bg-muted text-muted-foreground'
            )}
        >
            {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
        <div className="min-w-0">
            <p className="break-words text-sm font-medium leading-tight">{title}</p>
            <p className="break-words text-xs text-muted-foreground">
                {completed ? 'Completado o en edición' : 'Pendiente'}
            </p>
        </div>
    </div>
);

function SummaryField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="rounded-lg border bg-background/70 p-4 dark:bg-muted/20">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm">{value || 'Sin información registrada'}</p>
        </div>
    );
}

const getProbabilityLabel = (value?: string | number | null) => {
    const labelMap: Record<string, string> = {
        '1': 'EXTREMADAMENTE IMPROBABLE',
        '2': 'IMPROBABLE',
        '3': 'REMOTO',
        '4': 'OCASIONAL',
        '5': 'FRECUENTE',
    };

    return labelMap[String(value || '')] || (value ? String(value) : null);
};

function PlanSummary({
    mitigationPlan,
    analysis,
}: {
    mitigationPlan: MitigationPlan | null;
    analysis: Analysis | null;
}) {
    if (!mitigationPlan || !analysis) {
        return (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Todavía no hay plan y análisis registrados para esta notificación.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <SummaryField label="Área responsable" value={mitigationPlan.area_responsible} />
            <SummaryField label="Resultado del análisis" value={analysis.result} />
            <SummaryField
                label="Consecuencia a evaluar"
                value={mitigationPlan.consequence_to_evaluate}
            />
            <SummaryField
                label="Posibles consecuencias"
                value={mitigationPlan.possible_consequences}
            />
            <SummaryField label="Probabilidad" value={analysis.probability} />
            <SummaryField label="Severidad" value={analysis.severity} />
            <div className="md:col-span-2">
                <SummaryField label="Descripción del plan" value={mitigationPlan.description} />
            </div>
        </div>
    );
}

function RiskAssessmentSummary({
    assessment,
}: {
    assessment: RiskAssessment | null;
}) {
    if (!assessment) {
        return (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                Todavía no hay una evaluación estimada guardada para esta notificación.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <SummaryField label="Probabilidad" value={getProbabilityLabel(assessment.probability)} />
            <SummaryField label="Severidad" value={assessment.severity || 'Pendiente de cálculo'} />
            <SummaryField label="Resultado" value={assessment.result || 'Pendiente de cálculo'} />
            <SummaryField
                label="Última actualización"
                value={assessment.updated_at ? formatDate(assessment.updated_at) : 'Sin registro'}
            />
        </div>
    );
}

function MeasureDetails({ measure }: { measure: MitigationMeasure }) {
    return (
        <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
            <SummaryField label="Responsable" value={measure.implementation_responsible} />
            <SummaryField label="Supervisor" value={measure.implementation_supervisor} />
            <SummaryField label="Fecha estimada" value={formatDate(measure.estimated_date)} />
            <SummaryField
                label="Fecha de ejecución"
                value={measure.execution_date ? formatDate(measure.execution_date) : 'Pendiente'}
            />
            <div className="md:col-span-2">
                <SummaryField label="Descripción completa" value={measure.description} />
            </div>
        </div>
    );
}

const getDefaultWorkflowTab = (
    hasPlanAndAnalysis: boolean,
    measures: MitigationMeasure[],
    hasPostMitigationAnalysis: boolean
): 'plan' | 'measures' | 'controls' | 'post-analysis' => {
    if (hasPostMitigationAnalysis) {
        return 'post-analysis';
    }

    if (measures.some((measure) => getMeasureControls(measure).length > 0)) {
        return 'controls';
    }

    if (hasPlanAndAnalysis && measures.length > 0) {
        return 'measures';
    }

    return 'plan';
};

const toggleNumericId = (ids: number[], id: number) =>
    ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

type EvaluationWorkflowPanelProps = {
    company: string;
    selectedNotification: HazardNotification;
    currentMitigationPlan: MitigationPlan | null;
    currentPlanAnalysis: Analysis | null;
    currentPostMitigationAnalysis: Analysis | null;
    currentMeasures: MitigationMeasure[];
};

export function EvaluationWorkflowPanel({
    company,
    selectedNotification,
    currentMitigationPlan,
    currentPlanAnalysis,
    currentPostMitigationAnalysis,
    currentMeasures,
}: EvaluationWorkflowPanelProps) {
    const workflowStatus = getWorkflowStatus(selectedNotification);
    const hasPlanAndAnalysis = Boolean(currentMitigationPlan && currentPlanAnalysis);
    const hasPostMitigationAnalysis = Boolean(currentPostMitigationAnalysis);
    const totalControls = currentMeasures.reduce(
        (total, measure) => total + getMeasureControls(measure).length,
        0
    );
    const defaultTab = getDefaultWorkflowTab(
        hasPlanAndAnalysis,
        currentMeasures,
        hasPostMitigationAnalysis
    );

    const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
    const [isRiskAssessmentFormOpen, setIsRiskAssessmentFormOpen] = useState(false);
    const [isPostAnalysisFormOpen, setIsPostAnalysisFormOpen] = useState(false);
    const [measureEditorId, setMeasureEditorId] = useState<number | 'new' | null>(null);
    const [controlEditorKey, setControlEditorKey] = useState<string | null>(null);
    const [expandedMeasureIds, setExpandedMeasureIds] = useState<number[]>([]);
    const [expandedControlIds, setExpandedControlIds] = useState<number[]>([]);
    const [assessmentDraft, setAssessmentDraft] = useState<RiskAssessment | null>(null);

    const currentRiskAssessment =
        assessmentDraft ||
        selectedNotification.risk_assessment ||
        selectedNotification.riskAssessment ||
        selectedNotification.risk_assessments?.[0] ||
        null;
    const hasRiskAssessment = Boolean(currentRiskAssessment);

    useEffect(() => {
        setIsPlanFormOpen(false);
        setIsRiskAssessmentFormOpen(false);
        setIsPostAnalysisFormOpen(false);
        setMeasureEditorId(null);
        setControlEditorKey(null);
        setExpandedMeasureIds([]);
        setExpandedControlIds([]);
        setAssessmentDraft(null);
    }, [selectedNotification.id]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <FileStack className="h-5 w-5" />
                    Flujo de evaluación y mitigación
                </CardTitle>
                <CardDescription>
                    Trabajando sobre {getNotificationSource(selectedNotification)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{getNotificationSource(selectedNotification)}</Badge>
                            <Badge variant="outline">{selectedNotification.report_type}</Badge>
                            <Badge className={cn('border', workflowStatus.className)}>
                                {workflowStatus.label}
                            </Badge>
                        </div>

                        <p className="mt-3 text-sm text-muted-foreground">
                            {selectedNotification.description}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <StepBadge step={1} title="Plan y análisis" completed={hasPlanAndAnalysis} />
                        <StepBadge
                            step={2}
                            title="Medidas de mitigación"
                            completed={currentMeasures.length > 0}
                        />
                        <StepBadge
                            step={3}
                            title="Controles de seguimiento"
                            completed={currentMeasures.some(
                                (measure) => getMeasureControls(measure).length > 0
                            )}
                        />
                        <StepBadge
                            step={4}
                            title="Análisis post mitigación"
                            completed={hasPostMitigationAnalysis}
                        />
                    </div>

                    <Tabs
                        key={`workflow-tabs-${selectedNotification.id}`}
                        defaultValue={defaultTab}
                        className="space-y-6"
                    >
                        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-2 xl:grid-cols-4">
                            <TabsTrigger
                                value="plan"
                                className="h-auto min-w-0 items-start justify-between gap-2 rounded-lg border bg-background/70 px-4 py-3 text-left whitespace-normal data-[state=active]:border-primary dark:bg-muted/20"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="break-words leading-snug">Plan y análisis</span>
                                </span>
                                <Badge variant="outline" className="shrink-0">
                                    {hasPlanAndAnalysis ? 'Listo' : 'Pendiente'}
                                </Badge>
                            </TabsTrigger>

                            <TabsTrigger
                                value="measures"
                                className="h-auto min-w-0 items-start justify-between gap-2 rounded-lg border bg-background/70 px-4 py-3 text-left whitespace-normal data-[state=active]:border-primary dark:bg-muted/20"
                                disabled={!hasPlanAndAnalysis || !currentMitigationPlan}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 shrink-0" />
                                    <span className="break-words leading-snug">
                                        Medidas de mitigación
                                    </span>
                                </span>
                                <Badge variant="outline" className="shrink-0">
                                    {currentMeasures.length}
                                </Badge>
                            </TabsTrigger>

                            <TabsTrigger
                                value="controls"
                                className="h-auto min-w-0 items-start justify-between gap-2 rounded-lg border bg-background/70 px-4 py-3 text-left whitespace-normal data-[state=active]:border-primary dark:bg-muted/20"
                                disabled={!hasPlanAndAnalysis || currentMeasures.length === 0}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 shrink-0" />
                                    <span className="break-words leading-snug">
                                        Controles de seguimiento
                                    </span>
                                </span>
                                <Badge variant="outline" className="shrink-0">
                                    {totalControls}
                                </Badge>
                            </TabsTrigger>

                            <TabsTrigger
                                value="post-analysis"
                                className="h-auto min-w-0 items-start justify-between gap-2 rounded-lg border bg-background/70 px-4 py-3 text-left whitespace-normal data-[state=active]:border-primary dark:bg-muted/20"
                                disabled={!hasPlanAndAnalysis || !currentMitigationPlan || !currentMeasures.length}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="break-words leading-snug">
                                        Análisis post mitigación
                                    </span>
                                </span>
                                <Badge variant="outline" className="shrink-0">
                                    {hasPostMitigationAnalysis ? 'Listo' : 'Pendiente'}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="plan" className="space-y-4">
                            <Card className="border-dashed">
                                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1.5">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <ClipboardCheck className="h-5 w-5" />
                                            Estimación de riesgo
                                        </CardTitle>
                                        <CardDescription>
                                            Responda el árbol de probabilidad y severidad estimada.
                                        </CardDescription>
                                    </div>

                                    <Button
                                        type="button"
                                        variant={hasRiskAssessment ? 'outline' : 'default'}
                                        className="w-full whitespace-normal sm:w-auto"
                                        onClick={() => setIsRiskAssessmentFormOpen((value) => !value)}
                                    >
                                        {hasRiskAssessment ? (
                                            <PencilLine className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        {isRiskAssessmentFormOpen
                                            ? 'Ocultar formulario'
                                            : hasRiskAssessment
                                                ? 'Editar evaluación estimada'
                                                : 'Crear evaluación estimada'}
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <RiskAssessmentSummary assessment={currentRiskAssessment} />
                                </CardContent>
                            </Card>

                            {isRiskAssessmentFormOpen && (
                                <Card className="border-dashed">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            {hasRiskAssessment
                                                ? 'Editar evaluación estimada'
                                                : 'Crear evaluación estimada'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <RiskAssessmentForm
                                            company={company}
                                            selectedNotification={selectedNotification}
                                            currentAssessment={currentRiskAssessment}
                                            onSaved={(assessment) => {
                                                setAssessmentDraft(assessment);
                                                setIsRiskAssessmentFormOpen(false);
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-dashed">
                                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1.5">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileText className="h-5 w-5" />
                                            Plan de mitigación y análisis
                                        </CardTitle>
                                        <CardDescription>
                                            Revise la información cargada y abra el formulario solo
                                            cuando necesite crear o editar.
                                        </CardDescription>
                                    </div>

                                    <Button
                                        type="button"
                                        variant={hasPlanAndAnalysis ? 'outline' : 'default'}
                                        className="w-full whitespace-normal sm:w-auto"
                                        onClick={() => setIsPlanFormOpen((value) => !value)}
                                    >
                                        {hasPlanAndAnalysis ? (
                                            <PencilLine className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        {isPlanFormOpen
                                            ? 'Ocultar formulario'
                                            : hasPlanAndAnalysis
                                                ? 'Editar plan y análisis'
                                                : 'Crear plan y análisis'}
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <PlanSummary
                                        mitigationPlan={currentMitigationPlan}
                                        analysis={currentPlanAnalysis}
                                    />
                                </CardContent>
                            </Card>

                            {isPlanFormOpen && (
                                <Card className="border-dashed">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            {hasPlanAndAnalysis
                                                ? 'Editar plan y análisis'
                                                : 'Crear plan y análisis'}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CreateMitigationPlanAnalysis
                                            key={`plan-${selectedNotification.id}-${currentMitigationPlan?.id || 'new'}-${currentPlanAnalysis?.id || 'new'}`}
                                            hazardNotification={selectedNotification}
                                            initialData={{
                                                mitigationPlan: currentMitigationPlan,
                                                analysis: currentPlanAnalysis,
                                            }}
                                            suggestedAnalysis={
                                                currentRiskAssessment?.severity
                                                    ? {
                                                        probability: String(
                                                            currentRiskAssessment.probability
                                                        ),
                                                        severity: currentRiskAssessment.severity,
                                                    }
                                                    : null
                                            }
                                            onSuccess={() => setIsPlanFormOpen(false)}
                                            onCancel={() => setIsPlanFormOpen(false)}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="measures" className="space-y-4">
                            {!hasPlanAndAnalysis || !currentMitigationPlan ? (
                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    Primero debe registrar el plan de mitigación junto con el
                                    análisis para habilitar las medidas.
                                </div>
                            ) : (
                                <>
                                    <Card className="border-dashed">
                                        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-1.5">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <ShieldCheck className="h-5 w-5" />
                                                    Gestión de medidas
                                                </CardTitle>
                                                <CardDescription>
                                                    La lista muestra datos generales y cada medida se
                                                    puede expandir para ver más detalle.
                                                </CardDescription>
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setMeasureEditorId((value) =>
                                                        value === 'new' ? null : 'new'
                                                    )
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                {measureEditorId === 'new'
                                                    ? 'Ocultar formulario'
                                                    : currentMeasures.length
                                                        ? 'Crear medida'
                                                        : 'Crear primera medida'}
                                            </Button>
                                        </CardHeader>

                                        {measureEditorId === 'new' && (
                                            <CardContent>
                                                <CreateMitigationMeasure
                                                    mitigationPlanId={currentMitigationPlan.id}
                                                    onSuccess={() => setMeasureEditorId(null)}
                                                    onCancel={() => setMeasureEditorId(null)}
                                                />
                                            </CardContent>
                                        )}
                                    </Card>

                                    {currentMeasures.length ? (
                                        <div className="space-y-4">
                                            {currentMeasures.map((measure, index) => {
                                                const controls = getMeasureControls(measure);
                                                const isEditingMeasure =
                                                    measureEditorId === measure.id;
                                                const isExpanded = expandedMeasureIds.includes(
                                                    measure.id
                                                );

                                                return (
                                                    <Card key={measure.id} className="border-dashed">
                                                        <CardContent className="space-y-4 pt-6">
                                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                                <div className="space-y-2">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <ShieldCheck className="h-4 w-4" />
                                                                        <p className="text-base font-semibold">
                                                                            Medida #{index + 1}
                                                                        </p>
                                                                        <Badge variant="outline">
                                                                            {
                                                                                controls.length
                                                                            } control
                                                                            {controls.length === 1
                                                                                ? ''
                                                                                : 'es'}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                                        {measure.description}
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                                        <span>
                                                                            Responsable:{' '}
                                                                            {
                                                                                measure.implementation_responsible
                                                                            }
                                                                        </span>
                                                                        <span>
                                                                            Fecha:{' '}
                                                                            {formatDate(
                                                                                measure.estimated_date
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setExpandedMeasureIds(
                                                                                (ids) =>
                                                                                    toggleNumericId(
                                                                                        ids,
                                                                                        measure.id
                                                                                    )
                                                                            )
                                                                        }
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronUp className="mr-2 h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronDown className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        {isExpanded
                                                                            ? 'Ver menos'
                                                                            : 'Ver más'}
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setMeasureEditorId(
                                                                                (value) =>
                                                                                    value ===
                                                                                        measure.id
                                                                                        ? null
                                                                                        : measure.id
                                                                            );
                                                                            setExpandedMeasureIds(
                                                                                (ids) =>
                                                                                    ids.includes(
                                                                                        measure.id
                                                                                    )
                                                                                        ? ids
                                                                                        : [
                                                                                            ...ids,
                                                                                            measure.id,
                                                                                        ]
                                                                            );
                                                                        }}
                                                                    >
                                                                        <PencilLine className="mr-2 h-4 w-4" />
                                                                        {isEditingMeasure
                                                                            ? 'Ocultar formulario'
                                                                            : 'Editar'}
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {isExpanded && (
                                                                <MeasureDetails measure={measure} />
                                                            )}

                                                            {isEditingMeasure && (
                                                                <div className="rounded-lg border bg-muted/20 p-4">
                                                                    <CreateMitigationMeasure
                                                                        mitigationPlanId={
                                                                            currentMitigationPlan.id
                                                                        }
                                                                        initialData={measure}
                                                                        onSuccess={() =>
                                                                            setMeasureEditorId(null)
                                                                        }
                                                                        onCancel={() =>
                                                                            setMeasureEditorId(null)
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                            Aún no hay medidas de mitigación cargadas para esta
                                            notificación.
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="controls" className="space-y-4">
                            {!hasPlanAndAnalysis ? (
                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    Complete primero el plan y análisis para continuar con el
                                    seguimiento.
                                </div>
                            ) : !currentMeasures.length ? (
                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    Registre al menos una medida de mitigación para poder cargar
                                    controles de seguimiento.
                                </div>
                            ) : (
                                currentMeasures.map((measure, index) => {
                                    const controls: FollowUpControl[] = getMeasureControls(measure);
                                    const createControlKey = `new-${measure.id}`;
                                    const isCreatingControl =
                                        controlEditorKey === createControlKey;

                                    return (
                                        <Card key={measure.id} className="border-dashed">
                                            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-1.5">
                                                    <CardTitle className="text-lg">
                                                        Controles de la medida #{measure.id}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Cada control aparece como resumen y puede
                                                        expandirse para ver más detalle.
                                                    </CardDescription>
                                                </div>

                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        setControlEditorKey((value) =>
                                                            value === createControlKey
                                                                ? null
                                                                : createControlKey
                                                        )
                                                    }
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    {isCreatingControl
                                                        ? 'Ocultar formulario'
                                                        : controls.length
                                                            ? 'Agregar control'
                                                            : 'Crear control'}
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="rounded-lg border bg-background/70 p-4 dark:bg-muted/20">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <p className="font-medium">
                                                            Medida #{index + 1}
                                                        </p>
                                                        <Badge variant="outline">
                                                            {controls.length} control
                                                            {controls.length === 1 ? '' : 'es'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                        {measure.description}
                                                    </p>
                                                </div>

                                                {isCreatingControl && (
                                                    <div className="rounded-lg border bg-muted/20 p-4">
                                                        <CreateFollowUpControl
                                                            mitigationMeasureId={measure.id}
                                                            onSuccess={() =>
                                                                setControlEditorKey(null)
                                                            }
                                                            onCancel={() =>
                                                                setControlEditorKey(null)
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {controls.length ? (
                                                    <div className="space-y-3">
                                                        {controls.map((control) => {
                                                            const editControlKey = `edit-${control.id}`;
                                                            const isEditingControl =
                                                                controlEditorKey === editControlKey;
                                                            const isExpanded =
                                                                expandedControlIds.includes(control.id);

                                                            return (
                                                                <div
                                                                    key={control.id}
                                                                    className="rounded-lg border bg-background/80 p-4 dark:bg-muted/20"
                                                                >
                                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                                        <div className="space-y-2">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <Badge variant="outline">
                                                                                    Control #
                                                                                    {control.id}
                                                                                </Badge>
                                                                                <Badge variant="outline">
                                                                                    {formatDate(
                                                                                        control.date
                                                                                    )}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                                                {
                                                                                    control.description
                                                                                }
                                                                            </p>
                                                                        </div>

                                                                        <div className="flex flex-wrap gap-2">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    setExpandedControlIds(
                                                                                        (ids) =>
                                                                                            toggleNumericId(
                                                                                                ids,
                                                                                                control.id
                                                                                            )
                                                                                    )
                                                                                }
                                                                            >
                                                                                {isExpanded ? (
                                                                                    <ChevronUp className="mr-2 h-4 w-4" />
                                                                                ) : (
                                                                                    <ChevronDown className="mr-2 h-4 w-4" />
                                                                                )}
                                                                                {isExpanded
                                                                                    ? 'Ver menos'
                                                                                    : 'Ver más'}
                                                                            </Button>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setControlEditorKey(
                                                                                        (value) =>
                                                                                            value ===
                                                                                                editControlKey
                                                                                                ? null
                                                                                                : editControlKey
                                                                                    );
                                                                                    setExpandedControlIds(
                                                                                        (ids) =>
                                                                                            ids.includes(
                                                                                                control.id
                                                                                            )
                                                                                                ? ids
                                                                                                : [
                                                                                                    ...ids,
                                                                                                    control.id,
                                                                                                ]
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <PencilLine className="mr-2 h-4 w-4" />
                                                                                {isEditingControl
                                                                                    ? 'Ocultar formulario'
                                                                                    : 'Editar'}
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {isExpanded && (
                                                                        <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2">
                                                                            <SummaryField
                                                                                label="Descripción completa"
                                                                                value={
                                                                                    control.description
                                                                                }
                                                                            />
                                                                            <SummaryField
                                                                                label="Fecha"
                                                                                value={formatDate(
                                                                                    control.date
                                                                                )}
                                                                            />
                                                                            <SummaryField
                                                                                label="Imagen"
                                                                                value={
                                                                                    control.image
                                                                                        ? 'Adjunta'
                                                                                        : 'No adjunta'
                                                                                }
                                                                            />
                                                                            <SummaryField
                                                                                label="Documento"
                                                                                value={
                                                                                    control.document
                                                                                        ? 'Adjunto'
                                                                                        : 'No adjunto'
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {isEditingControl && (
                                                                        <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                                                                            <CreateFollowUpControl
                                                                                mitigationMeasureId={
                                                                                    measure.id
                                                                                }
                                                                                initialData={control}
                                                                                onSuccess={() =>
                                                                                    setControlEditorKey(
                                                                                        null
                                                                                    )
                                                                                }
                                                                                onCancel={() =>
                                                                                    setControlEditorKey(
                                                                                        null
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                                        Todavía no hay seguimientos cargados para esta
                                                        medida.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </TabsContent>

                        <TabsContent value="post-analysis" className="space-y-4">
                            {!hasPlanAndAnalysis || !currentMitigationPlan ? (
                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    Complete primero el plan y análisis para registrar el análisis
                                    post mitigación.
                                </div>
                            ) : !currentMeasures.length ? (
                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                    Registre al menos una medida de mitigación antes del análisis
                                    post mitigación.
                                </div>
                            ) : (
                                <>
                                    <Card className="border-dashed">
                                        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="space-y-1.5">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <FileText className="h-5 w-5" />
                                                    Análisis post mitigación
                                                </CardTitle>
                                                <CardDescription>
                                                    Este análisis se guarda asociado al plan de
                                                    mitigación.
                                                </CardDescription>
                                            </div>

                                            <Button
                                                type="button"
                                                variant={hasPostMitigationAnalysis ? 'outline' : 'default'}
                                                className="w-full whitespace-normal sm:w-auto"
                                                onClick={() =>
                                                    setIsPostAnalysisFormOpen((value) => !value)
                                                }
                                            >
                                                {hasPostMitigationAnalysis ? (
                                                    <PencilLine className="mr-2 h-4 w-4" />
                                                ) : (
                                                    <Plus className="mr-2 h-4 w-4" />
                                                )}
                                                {isPostAnalysisFormOpen
                                                    ? 'Ocultar formulario'
                                                    : hasPostMitigationAnalysis
                                                        ? 'Editar análisis post mitigación'
                                                        : 'Crear análisis post mitigación'}
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {hasPostMitigationAnalysis ? (
                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                    <SummaryField
                                                        label="Resultado del análisis"
                                                        value={currentPostMitigationAnalysis?.result}
                                                    />
                                                    <SummaryField
                                                        label="Probabilidad"
                                                        value={currentPostMitigationAnalysis?.probability}
                                                    />
                                                    <SummaryField
                                                        label="Severidad"
                                                        value={currentPostMitigationAnalysis?.severity}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                                    Todavía no hay análisis post mitigación registrado
                                                    para este plan.
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {isPostAnalysisFormOpen && (
                                        <Card className="border-dashed">
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    {hasPostMitigationAnalysis
                                                        ? 'Editar análisis post mitigación'
                                                        : 'Crear análisis post mitigación'}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <CreateMitigationPlanAnalysis
                                                    key={`post-analysis-${selectedNotification.id}-${currentMitigationPlan.id}-${currentPostMitigationAnalysis?.id || 'new'}`}
                                                    hazardNotification={selectedNotification}
                                                    mode="analysis-only"
                                                    mitigationPlanId={currentMitigationPlan.id}
                                                    initialData={{
                                                        mitigationPlan: currentMitigationPlan,
                                                        analysis: currentPostMitigationAnalysis,
                                                    }}
                                                    onSuccess={() =>
                                                        setIsPostAnalysisFormOpen(false)
                                                    }
                                                    onCancel={() =>
                                                        setIsPostAnalysisFormOpen(false)
                                                    }
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}
