'use client';

import { HardTimeCategoryResource, StoreIntervalRequest } from '@api/types';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Upload,
  Wrench,
} from 'lucide-react';

import {
  HardTimeImportStructureComponentInput,
  useImportHardTimeStructure,
} from '@/actions/planificacion/hard_time/actions';
import {
  HardTimeImportComponentPreview,
  HardTimeImportIntervalPreview,
  HardTimePositionConfidence,
  processHardTimeExcelImport,
} from '@/actions/planificacion/hard_time/excelImportProcessor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function confidenceMeta(confidence: HardTimePositionConfidence) {
  switch (confidence) {
    case 'high':
      return {
        label: 'Alta',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      };
    case 'medium':
      return {
        label: 'Media',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      };
    case 'low':
      return {
        label: 'Baja',
        className: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
      };
    default:
      return {
        label: 'Manual',
        className: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
      };
  }
}

function componentKey(component: HardTimeImportComponentPreview) {
  return `${component.description}::${component.part_number ?? ''}::${component.serial_number ?? ''}`;
}

function intervalSummary(component: HardTimeImportComponentPreview) {
  const byControl = component.intervals.reduce(
    (acc, interval) => {
      acc[interval.control] = (acc[interval.control] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(byControl)
    .filter(([, count]) => count > 0)
    .map(([control, count]) => `${count} ${control}`)
    .join(' · ');
}

function isIntervalImportable(interval: HardTimeImportIntervalPreview) {
  return Boolean(interval.interval_hours || interval.interval_cycles || interval.interval_days);
}

function buildIntervalPayload(interval: HardTimeImportIntervalPreview): StoreIntervalRequest {
  return {
    task_description: interval.task_description,
    interval_hours: interval.interval_hours ?? undefined,
    interval_cycles: interval.interval_cycles ?? undefined,
    interval_days: interval.interval_days ?? undefined,
  };
}

function getImportIssues(component: HardTimeImportComponentPreview, position: string) {
  const issues: string[] = [];

  if (!component.part_number?.trim()) issues.push('Falta P/N');
  if (!position.trim()) issues.push('Falta posición');
  if (!component.intervals.some(isIntervalImportable)) issues.push('Sin intervalos válidos');

  return issues;
}

function getImportPayload(
  component: HardTimeImportComponentPreview,
  position: string,
): HardTimeImportStructureComponentInput | null {
  const issues = getImportIssues(component, position);

  if (issues.length > 0 || !component.part_number?.trim()) return null;

  return {
    description: component.description,
    part_number: component.part_number.trim(),
    position: position.trim(),
    ata_chapter: undefined,
    intervals: component.intervals.filter(isIntervalImportable).map(buildIntervalPayload),
  };
}

export function HardTimeImportDialog({
  open,
  onOpenChange,
  aircraftId,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: number | null;
  categories: HardTimeCategoryResource[];
}) {
  const importStructure = useImportHardTimeStructure(aircraftId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [components, setComponents] = useState<HardTimeImportComponentPreview[]>([]);
  const [editedPositions, setEditedPositions] = useState<Record<string, string>>({});
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | HardTimePositionConfidence>('all');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('');

  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
      setFileName(null);
      setErrorMessage(null);
      setComponents([]);
      setEditedPositions({});
      setConfidenceFilter('all');
      setSelectedCategoryCode('');
    }
  }, [open]);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const preview = await processHardTimeExcelImport(file);
      setFileName(file.name);
      setComponents(preview.components);
      setEditedPositions(
        Object.fromEntries(
          preview.components.map((component) => [
            componentKey(component),
            component.position_suggestion.position ?? '',
          ]),
        ),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo procesar archivo INAC.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: (files) => {
      const file = files[0];
      if (file) {
        void handleFile(file);
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const summary = components.reduce(
    (acc, component) => {
      acc.intervals += component.intervals.length;
      acc[component.position_suggestion.confidence] += 1;
      return acc;
    },
    { intervals: 0, high: 0, medium: 0, low: 0, manual: 0 },
  );

  const filteredComponents =
    confidenceFilter === 'all'
      ? components
      : components.filter((component) => component.position_suggestion.confidence === confidenceFilter);

  const importableComponents = components
    .map((component) =>
      getImportPayload(component, editedPositions[componentKey(component)] ?? component.position_suggestion.position ?? ''),
    )
    .filter((component): component is HardTimeImportStructureComponentInput => component !== null);

  const blockedCount = components.length - importableComponents.length;

  const handleImport = async () => {
    if (!aircraftId || !selectedCategoryCode || importableComponents.length === 0) return;

    await importStructure.mutateAsync({
      aircraft_id: aircraftId,
      category_code: selectedCategoryCode,
      components: importableComponents,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-7xl overflow-hidden p-0 flex flex-col">
        <div className="flex size-full flex-col min-w-0 min-h-0">
          <DialogHeader className="border-b border-border/60 bg-muted/15 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-border/60 bg-background p-3">
                <Upload className="size-5 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle>Importar control INAC Hard Time</DialogTitle>
                <DialogDescription>
                  Carga libro INAC, revisa ubicaciones inferidas y confirma importación de estructura.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 min-w-0 min-h-0">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div
                {...getRootProps()}
                className={`rounded-2xl border border-dashed p-6 transition ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/10'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-semibold text-foreground">Libro INAC 43-004</p>
                    </div>
                    <p className="max-w-xl text-sm text-muted-foreground">
                      Se leen sólo hojas INAC, se deduplican registros repetidos y se prepara preview antes de crear
                      componentes controlados.
                    </p>
                    {fileName && <p className="text-xs text-muted-foreground">Archivo cargado: {fileName}</p>}
                  </div>

                  <Button type="button" variant="outline" className="gap-2">
                    {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {isProcessing ? 'Procesando...' : 'Seleccionar Excel'}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Parámetros de importación</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Capítulo ATA</label>
                    <Select value={selectedCategoryCode} onValueChange={setSelectedCategoryCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona capítulo ATA para componentes importados" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.name} ({category.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Esta fase crea componentes controlados e intervalos. No monta seriales ni reconstruye cumplimientos.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-100">
                    <div className="mb-2 flex items-center gap-2 font-medium">
                      <AlertCircle className="size-4" />
                      Alcance de esta confirmación
                    </div>
                    <p className="text-xs leading-5 text-amber-800/90 dark:text-amber-200/80">
                      El Excel no trae ubicación ni datos consistentes para montaje legado. Por seguridad, esta
                      importación deja lista la estructura del control y sus intervalos para completar montaje después.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {components.length > 0 && (
              <>
                <div className="grid gap-3 md:grid-cols-5">
                  <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <SearchCheck className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Detectados</p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{components.length}</p>
                    <p className="text-xs text-muted-foreground">{summary.intervals} intervalos en preview</p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-medium">Listos</p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{importableComponents.length}</p>
                    <p className="text-xs text-muted-foreground">Entran a la importación estructural</p>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-medium">Revisar</p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{summary.medium + summary.low}</p>
                    <p className="text-xs text-muted-foreground">Ubicaciones sugeridas con menor confianza</p>
                  </div>

                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldAlert className="size-4 text-red-600 dark:text-red-400" />
                      <p className="text-sm font-medium">Bloqueados</p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{blockedCount}</p>
                    <p className="text-xs text-muted-foreground">Faltan datos mínimos para crear componente</p>
                  </div>

                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <FileSpreadsheet className="size-4 text-sky-600 dark:text-sky-400" />
                      <p className="text-sm font-medium">Manual</p>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{summary.manual}</p>
                    <p className="text-xs text-muted-foreground">Sin ubicación inferida automáticamente</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Preview operativo</p>
                      <p className="text-xs text-muted-foreground">
                        Ajusta ubicación. Los registros sin P/N, sin ubicación o sin intervalos válidos quedan fuera.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(['all', 'high', 'medium', 'low', 'manual'] as const).map((value) => (
                        <Button
                          key={value}
                          type="button"
                          variant={confidenceFilter === value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setConfidenceFilter(value)}
                        >
                          {value === 'all' ? 'Todos' : confidenceMeta(value).label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <ScrollArea className="mt-4 h-[460px] rounded-xl border border-border/60 bg-background">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background [&_th]:border-b [&_th]:border-border/60">
                        <TableRow>
                          <TableHead>Componente</TableHead>
                          <TableHead>Identidad</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Confianza</TableHead>
                          <TableHead>Intervalos</TableHead>
                          <TableHead>Estado importación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&_tr:last-child>td]:border-0 [&_td]:border-b [&_td]:border-border/50">
                        {filteredComponents.map((component) => {
                          const key = componentKey(component);
                          const currentPosition =
                            editedPositions[key] ?? component.position_suggestion.position ?? '';
                          const importIssues = getImportIssues(component, currentPosition);
                          const meta = confidenceMeta(component.position_suggestion.confidence);

                          return (
                            <TableRow key={key} className="align-top">
                              <TableCell className="min-w-[280px]">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-foreground">{component.description}</p>
                                  {component.reference && (
                                    <p className="text-[11px] text-muted-foreground">{component.reference}</p>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="min-w-[200px]">
                                <div className="space-y-1 text-xs">
                                  <p className="font-mono text-foreground">P/N: {component.part_number ?? '—'}</p>
                                  <p className="font-mono text-muted-foreground">S/N: {component.serial_number ?? '—'}</p>
                                </div>
                              </TableCell>

                              <TableCell className="min-w-[240px]">
                                <div className="space-y-2">
                                  <Input
                                    value={currentPosition}
                                    onChange={(event) =>
                                      setEditedPositions((current) => ({ ...current, [key]: event.target.value }))
                                    }
                                    placeholder="Definir ubicación"
                                  />
                                  {component.position_suggestion.rule && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Regla: {component.position_suggestion.rule}
                                    </p>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <span
                                  className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-medium ${meta.className}`}
                                >
                                  {meta.label}
                                </span>
                              </TableCell>

                              <TableCell className="min-w-[200px]">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-foreground">{component.intervals.length} intervalos</p>
                                  <p className="text-[11px] text-muted-foreground">{intervalSummary(component)}</p>
                                  {component.intervals.slice(0, 2).map((interval, index) => (
                                    <p key={`${key}-interval-${index}`} className="text-[11px] text-muted-foreground">
                                      {interval.task_description}
                                    </p>
                                  ))}
                                  {component.intervals.length > 2 && (
                                    <p className="text-[11px] text-muted-foreground/70">
                                      +{component.intervals.length - 2} tareas más
                                    </p>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="min-w-[220px]">
                                {importIssues.length > 0 ? (
                                  <div className="space-y-1">
                                    {importIssues.map((issue) => (
                                      <p key={`${key}-${issue}`} className="text-[11px] text-red-700 dark:text-red-300">
                                        {issue}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                      Listo para crear estructura
                                    </p>
                                    {component.warnings.slice(0, 2).map((warning) => (
                                      <p key={`${key}-${warning}`} className="text-[11px] text-muted-foreground">
                                        {warning}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-border/60 bg-background px-6 py-4 sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="size-3.5" />
              Se importan sólo componentes controlados e intervalos desde `.gen/api`.
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled={
                  !aircraftId ||
                  !selectedCategoryCode ||
                  importableComponents.length === 0 ||
                  isProcessing ||
                  importStructure.isPending
                }
                onClick={() => void handleImport()}
              >
                {importStructure.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Confirmar importación
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
