'use client';

// Extraction Review – v3 (react-hook-form)
// Left: react-hook-form editable form (header + groups/drivers)
// Right: PDF preview (react-pdf)

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';

import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// ---------- Types ----------
export type DriverHit = { type: 'thresh' | 'repeat'; unit: 'HRS' | 'CYC' | 'DAYS'; value: number };
export type ExtractedGroup = { label: string; body: string; drivers: DriverHit[] };
export type ExtractionPayload = {
  text?: string;
  source_ref?: string | null;
  effective_date?: string | null; // YYYY-MM-DD
  ata?: string | null;
  applicability?: any | null;
  groups: ExtractedGroup[];
};
export type Extraction = {
  id: number;
  parser: string;
  status: 'PENDING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  confidence: { global: number } & Record<string, number>;
  payload: ExtractionPayload;
  document_id: number;
};

// ---------- API helper ----------
const API = async (path: string, init?: RequestInit) => {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ---------- Data hooks ----------
function useExtraction(extractionId?: string) {
  return useQuery<{ data: Extraction }>({
    queryKey: ['extraction', extractionId],
    enabled: !!extractionId,
    queryFn: () => API(`/api/extractions/${extractionId}`),
  });
}

function usePatchExtraction(extractionId: string) {
  return useMutation({
    mutationFn: (patch: Partial<ExtractionPayload>) =>
      API(`/api/extractions/${extractionId}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  });
}

function usePublishExtraction(extractionId: string) {
  return useMutation({ mutationFn: () => API(`/api/extractions/${extractionId}/publish`, { method: 'POST' }) });
}

// ---------- Schema (zod) ----------
const driverSchema = z.object({
  type: z.enum(['thresh', 'repeat']),
  unit: z.enum(['HRS', 'CYC', 'DAYS']),
  value: z.coerce.number().min(0),
});

const groupSchema = z.object({
  label: z.string().optional().default(''),
  body: z.string().min(1, 'Requerido'),
  drivers: z.array(driverSchema).min(1, 'Al menos un driver'),
});

const formSchema = z.object({
  source_ref: z.string().min(1, 'AD Ref requerido'),
  effective_date: z.string().optional().nullable(),
  ata: z.string().optional().nullable(),
  applicability: z.any().optional().nullable(),
  text: z.string().optional(),
  groups: z.array(groupSchema).min(1, 'Debe existir al menos un grupo'),
});

export type ReviewForm = z.infer<typeof formSchema>;

// ---------- UI helpers ----------
function ConfidenceBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const clr = value >= 0.8 ? 'default' : value >= 0.6 ? 'secondary' : 'destructive';
  const label = value >= 0.8 ? 'Alta' : value >= 0.6 ? 'Media' : 'Baja';
  return (
    <Badge variant={clr as any}>
      Confianza {Math.round(value * 100)}% · {label}
    </Badge>
  );
}

// ---------- Component ----------
export default function ExtractionReviewPage() {
  const params = useParams();
  const extractionId = String((params as any)?.extractionId ?? '');

  const { data, isLoading, isError } = useExtraction(extractionId);
  const extraction = data?.data;

  const patchMut = usePatchExtraction(extractionId);
  const publishMut = usePublishExtraction(extractionId);

  // PDF controls
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const pdfUrl = useMemo(() => (extraction ? `/api/documents/${extraction.document_id}/pdf` : undefined), [extraction]);

  // Form
  const form = useForm<ReviewForm>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: undefined,
  });

  // Seed form with payload
  useEffect(() => {
    if (extraction?.payload) {
      const p = extraction.payload;
      form.reset({
        source_ref: p.source_ref ?? '',
        effective_date: p.effective_date ?? '',
        ata: p.ata ?? '',
        applicability: p.applicability ?? {},
        text: p.text ?? '',
        groups: p.groups?.length ? p.groups : [{ label: 'g', body: '', drivers: [] }],
      });
    }
  }, [extraction, form]);

  // Autosave (debounced on change)
  const debounce = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const sub = form.watch((_, { name }) => {
      if (!name) return;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(async () => {
        const patch: Partial<ReviewForm> = {} as any;
        // Para minimizar payload, podemos enviar todo; el backend hace merge parcial
        Object.assign(patch, form.getValues());
        try {
          await patchMut.mutateAsync(patch);
        } catch (e: any) {
          /* evita ruido */
        }
      }, 800);
    });
    return () => sub.unsubscribe();
  }, [form, patchMut]);

  // Field arrays (groups + nested drivers)
  const groupsFA = useFieldArray({ control: form.control, name: 'groups' });

  const addGroup = () => groupsFA.append({ label: '', body: '', drivers: [] });
  const removeGroup = (idx: number) => groupsFA.remove(idx);

  const addDriver = (gIdx: number, type: 'thresh' | 'repeat') => {
    const curr = form.getValues(`groups.${gIdx}.drivers`) || [];
    form.setValue(`groups.${gIdx}.drivers`, [...curr, { type, unit: 'DAYS', value: 0 }], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  const removeDriver = (gIdx: number, dIdx: number) => {
    const curr = [...(form.getValues(`groups.${gIdx}.drivers`) || [])];
    curr.splice(dIdx, 1);
    form.setValue(`groups.${gIdx}.drivers`, curr, { shouldDirty: true, shouldTouch: true });
  };

  const onSubmit = async (values: ReviewForm) => {
    try {
      await patchMut.mutateAsync(values);
      toast.success('Guardado');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar');
    }
  };

  const publish = async () => {
    try {
      await publishMut.mutateAsync();
      toast.success('Publicado a task_masters');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo publicar');
    }
  };

  if (isLoading)
    return (
      <div className="p-6 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    );
  if (isError || !extraction) return <div className="p-6">No se pudo cargar la extracción.</div>;

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
      {/* Left: Form */}
      <div className="overflow-y-auto pr-1">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-3 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ScrollText className="h-4 w-4" /> Revisión · <span>#{extraction.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge value={extraction.confidence?.global} />
            <Button size="sm" variant="outline" onClick={form.handleSubmit(onSubmit)} className="gap-1">
              <Save className="h-4 w-4" />
              Guardar
            </Button>
            <Button size="sm" onClick={publish} className="gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Encabezado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>AD Ref</Label>
              <Input {...form.register('source_ref')} placeholder="AD 2025-02-02" />
            </div>
            <div>
              <Label>Effective date</Label>
              <Input type="date" {...form.register('effective_date')} />
            </div>
            <div>
              <Label>ATA</Label>
              <Input {...form.register('ata')} placeholder="53" />
            </div>
            <div className="md:col-span-2">
              <Label>Applicability (JSON)</Label>
              <Controller
                control={form.control}
                name="applicability"
                render={({ field: { value, onChange } }) => (
                  <Textarea
                    className="font-mono min-h-28"
                    value={JSON.stringify(value ?? {}, null, 2)}
                    onChange={(e) => {
                      try {
                        onChange(JSON.parse(e.target.value || '{}'));
                      } catch {
                        /*ignore*/
                      }
                    }}
                    placeholder='{"aircraft":{"type":"B737","series":["-300","-400"]}}'
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="groups">
          <TabsList>
            <TabsTrigger value="groups">Grupos & Drivers</TabsTrigger>
            <TabsTrigger value="raw">Texto crudo</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4 pt-3">
            {groupsFA.fields.map((field, gIdx) => (
              <Card key={field.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Pencil className="h-4 w-4" /> Grupo {form.watch(`groups.${gIdx}.label`) || gIdx + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 w-28"
                      placeholder="label"
                      {...form.register(`groups.${gIdx}.label` as const)}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeGroup(gIdx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Extracto</Label>
                    <Textarea {...form.register(`groups.${gIdx}.body` as const)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Drivers</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => addDriver(gIdx, 'thresh')}>
                          <Plus className="h-4 w-4 mr-1" /> Inicial
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => addDriver(gIdx, 'repeat')}>
                          <Plus className="h-4 w-4 mr-1" /> Repetición
                        </Button>
                      </div>
                    </div>

                    {(form.watch(`groups.${gIdx}.drivers`) || []).map((_, dIdx) => (
                      <div key={dIdx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <Label className="text-xs">Tipo</Label>
                          <select
                            className="w-full border rounded h-9 px-2 bg-background"
                            {...form.register(`groups.${gIdx}.drivers.${dIdx}.type` as const)}
                          >
                            <option value="thresh">Inicial (thresh)</option>
                            <option value="repeat">Repetición</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Unidad</Label>
                          <select
                            className="w-full border rounded h-9 px-2 bg-background"
                            {...form.register(`groups.${gIdx}.drivers.${dIdx}.unit` as const)}
                          >
                            <option value="HRS">HRS</option>
                            <option value="CYC">CYC</option>
                            <option value="DAYS">DAYS</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs">Valor</Label>
                          <Input
                            inputMode="numeric"
                            {...form.register(`groups.${gIdx}.drivers.${dIdx}.value` as const, { valueAsNumber: true })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => removeDriver(gIdx, dIdx)}
                          >
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addGroup} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar grupo
            </Button>
          </TabsContent>

          <TabsContent value="raw" className="pt-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Texto detectado (truncado)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {form.getValues('text')?.slice(0, 30000) ?? ''}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={form.handleSubmit(onSubmit)} className="gap-2">
            <Save className="h-4 w-4" />
            Guardar
          </Button>
          <Button onClick={publish} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>

      {/* Right: PDF Viewer */}
      <div className="h-full border rounded-lg overflow-hidden">
        {pdfUrl ? (
          <div className="h-full flex flex-col">
            <div className="p-2 flex items-center justify-between bg-muted/50 border-b">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> PDF del AD
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button size="icon" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm w-28 text-center">
                  Página {page} / {numPages ?? '?'}
                </span>
                <Button size="icon" variant="outline" onClick={() => setPage((p) => Math.min(numPages ?? p, p + 1))}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <a href={pdfUrl} download className="inline-flex">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </a>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-start justify-center bg-background">
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<div className="p-6">Cargando PDF…</div>}
              >
                <Page pageNumber={page} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">No hay PDF</div>
        )}
      </div>
    </div>
  );
}
