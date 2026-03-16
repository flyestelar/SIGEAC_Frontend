'use client';

import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGetRequisitionByOrderNumber } from '@/hooks/mantenimiento/compras/useGetRequisitionByOrderNumber';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  Plane,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────

const DOC_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL!;

// ─── Utilities ────────────────────────────────────────────────────────────────

const joinUrl = (base: string, path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base?.replace(/\/$/, '') || ''}/${path.replace(/^\//, '')}`;
};

const fileExt = (p: string) => (p.split('?')[0].split('.').pop() || '').toLowerCase();
const isPdf = (p: string) => fileExt(p) === 'pdf';
const isImg = (p: string) => ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(fileExt(p));
const isExcel = (p: string) => ['xlsx', 'xls', 'csv'].includes(fileExt(p));
const isWord = (p: string) => ['docx', 'doc'].includes(fileExt(p));
const canEmbed = (p: string) => isPdf(p) || isImg(p);

const getFileLabel = (p: string) => {
  if (isPdf(p)) return 'PDF';
  if (isImg(p)) return 'IMG';
  if (isExcel(p)) return 'EXCEL';
  if (isWord(p)) return 'WORD';
  return fileExt(p).toUpperCase() || 'FILE';
};

const getFileIcon = (p: string) => {
  if (isPdf(p)) return FileText;
  if (isImg(p)) return ImageIcon;
  if (isExcel(p)) return FileSpreadsheet;
  return File;
};

const niceName = (path: string) => {
  try {
    return decodeURIComponent(path.split('?')[0].split('/').pop() || path);
  } catch {
    return path.split('/').pop() || path;
  }
};

// ─── Status ───────────────────────────────────────────────────────────────────

const normalizeStatus = (s?: string) => (s ?? '').toString().trim().toLowerCase();
const resolveStatus = (status?: string) => {
  const s = normalizeStatus(status);
  if (s.includes('aprob'))
    return {
      label: (status ?? '').toUpperCase(),
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };
  if (s.includes('rech'))
    return {
      label: (status ?? '').toUpperCase(),
      className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    };
  return {
    label: (status ?? 'EN PROCESO').toUpperCase(),
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
};

// ─── Requisition Target ───────────────────────────────────────────────────────

type RequisitionTarget = 'AIRCRAFT' | 'FLEET' | 'WORKSHOP';

const TARGET_CONFIG: Record<
  RequisitionTarget,
  {
    Icon: React.ElementType;
    label: string;
    iconBg: string;
    iconText: string;
    iconBorder: string;
    stripBg: string;
    stripBorder: string;
    accentText: string;
  }
> = {
  AIRCRAFT: {
    Icon: Plane,
    label: 'Aeronave',
    iconBg: 'bg-sky-500/10',
    iconText: 'text-sky-600 dark:text-sky-400',
    iconBorder: 'border-sky-500/30',
    stripBg: 'bg-sky-50 dark:bg-sky-950/20',
    stripBorder: 'border-sky-200 dark:border-sky-800/40',
    accentText: 'text-sky-600 dark:text-sky-400',
  },
  FLEET: {
    Icon: Layers,
    label: 'Flota',
    iconBg: 'bg-indigo-500/10',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    iconBorder: 'border-indigo-500/30',
    stripBg: 'bg-indigo-50 dark:bg-indigo-950/20',
    stripBorder: 'border-indigo-200 dark:border-indigo-800/40',
    accentText: 'text-indigo-600 dark:text-indigo-400',
  },
  WORKSHOP: {
    Icon: Wrench,
    label: 'Taller',
    iconBg: 'bg-orange-500/10',
    iconText: 'text-orange-600 dark:text-orange-400',
    iconBorder: 'border-orange-500/30',
    stripBg: 'bg-orange-50 dark:bg-orange-950/20',
    stripBorder: 'border-orange-200 dark:border-orange-800/40',
    accentText: 'text-orange-600 dark:text-orange-400',
  },
};

// ─── Unit label ───────────────────────────────────────────────────────────────

const getUnitLabel = (unit?: { secondary_unit?: string; unit?: { label?: string; value?: string } }) => {
  if (!unit) return null;
  return unit.secondary_unit || unit.unit?.label || unit.unit?.value || null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function InfoCell({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <div className={cn('text-sm font-medium', mono && 'font-mono')}>
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </div>
    </div>
  );
}

function DocPreview({ path }: { path: string }) {
  const url = useMemo(() => joinUrl(DOC_BASE_URL, path), [path]);
  const name = useMemo(() => niceName(path), [path]);
  const FileIcon = getFileIcon(path);
  const typeLabel = getFileLabel(path);
  const embeddable = canEmbed(path);

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b bg-muted/20 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-medium">{name}</span>
          <span className="shrink-0 rounded border px-1 py-0 text-[10px] font-medium uppercase text-muted-foreground">
            {typeLabel}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          className="h-6 w-6 shrink-0 p-0"
          aria-label="Abrir en nueva pestaña"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Preview area */}
      {embeddable ? (
        <div
          className="h-[240px] overflow-hidden cursor-pointer"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          {isPdf(path) ? (
            <iframe
              src={url}
              className="h-full w-full"
              title={name}
              sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-popups"
            />
          ) : (
            <div className="relative h-full w-full bg-muted/10">
              <Image src={url} alt={name} fill className="object-contain" unoptimized />
            </div>
          )}
        </div>
      ) : (
        /* Non-embeddable: Excel, Word, etc. */
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted/20">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium">{name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Los archivos {typeLabel} no se pueden previsualizar
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <Download className="h-3 w-3" />
            Descargar
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const RequisitionPage = () => {
  const { selectedCompany } = useCompanyStore();
  const router = useRouter();
  const { order_number } = useParams<{ order_number: string }>();

  const { data, isLoading, isError } = useGetRequisitionByOrderNumber({
    company: selectedCompany?.slug,
    order_number,
  });

  if (isLoading) return <LoadingPage />;

  if (isError || !data) {
    return (
      <ContentLayout title="Almacén">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-background p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted/20">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No se pudo cargar la requisición</p>
            <p className="mt-1 text-sm text-muted-foreground">Verifica el número de orden e intenta nuevamente.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Volver
          </Button>
        </div>
      </ContentLayout>
    );
  }

  const status = resolveStatus(data.status);
  const target: RequisitionTarget = (data.requisition_target as RequisitionTarget) ?? 'AIRCRAFT';
  const tCfg = TARGET_CONFIG[target] ?? TARGET_CONFIG.AIRCRAFT;
  const { Icon: TargetIcon } = tCfg;

  const isWorkshop = target === 'WORKSHOP';
  const isFleet = target === 'FLEET';

  const requisitionDocs: string[] = Array.isArray(data.document) ? data.document : [];

  return (
    <ContentLayout title="Almacén">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-lg border bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="-ml-1 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Requisición</span>
                <span className="font-mono text-base font-semibold tracking-tight">#{data.order_number}</span>
              </div>
            </div>
            <Badge variant="outline" className={cn('px-2.5 py-0.5 text-xs font-semibold', status.className)}>
              {status.label}
            </Badge>
          </div>

          {/* Context strip — signature element */}
          <div className={cn('flex items-center gap-3 border-t px-5 py-2.5', tCfg.stripBg, tCfg.stripBorder)}>
            <div
              className={cn('flex h-6 w-6 items-center justify-center rounded border', tCfg.iconBg, tCfg.iconBorder)}
            >
              <TargetIcon className={cn('h-3 w-3', tCfg.iconText)} />
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-[11px] font-bold uppercase tracking-widest', tCfg.accentText)}>
                {tCfg.label}
              </span>
              {!isWorkshop && data.aircraft?.acronym && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-mono text-sm font-semibold">{data.aircraft.acronym}</span>
                </>
              )}
              {isWorkshop && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-sm text-muted-foreground">Mantenimiento en taller</span>
                </>
              )}
              {isFleet && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-sm text-muted-foreground">Aplicable a toda la flota</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* ── Left column ── */}
          <div className="space-y-4 lg:col-span-8">
            {/* Summary */}
            <div className="rounded-lg border bg-background">
              <div className="border-b px-5 py-3">
                <FieldLabel>Resumen</FieldLabel>
              </div>
              <div className="space-y-5 p-5">
                {/* Primary grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                  <InfoCell
                    label="Fecha de solicitud"
                    value={format(new Date(data.submission_date), 'dd MMM yyyy', { locale: es })}
                  />
                  <InfoCell
                    label="Prioridad"
                    value={
                      data.priority ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-semibold',
                            ['HIGH', 'AOG'].includes(data.priority)
                              ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {data.priority}
                        </Badge>
                      ) : null
                    }
                  />
                  <InfoCell label="Orden de trabajo" value={data.work_order} mono />
                  {isWorkshop ? (
                    <InfoCell
                      label="Target"
                      value={
                        <span className={cn('text-xs font-bold uppercase tracking-wide', tCfg.accentText)}>Taller</span>
                      }
                    />
                  ) : (
                    <InfoCell label="Aeronave" value={data.aircraft?.acronym} mono />
                  )}
                </div>

                <Separator />

                {/* People */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                  <InfoCell
                    label="Creado por"
                    value={
                      <div>
                        <p>
                          {data.created_by?.first_name} {data.created_by?.last_name}
                        </p>
                        {data.created_by?.email && (
                          <p className="mt-0.5 text-xs font-normal text-muted-foreground">{data.created_by.email}</p>
                        )}
                      </div>
                    }
                  />
                  <InfoCell label="Solicitado por" value={data.requested_by} />
                  {data.received_by && <InfoCell label="Recibido por" value={data.received_by} />}
                </div>

                {/* Justification */}
                {data.justification && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <FieldLabel>Justificación</FieldLabel>
                      <p className="text-sm leading-relaxed text-foreground/80">{data.justification}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Batches */}
            {data.batch?.length > 0 && (
              <div className="space-y-3">
                <FieldLabel>Artículos solicitados</FieldLabel>
                <ScrollArea className="h-[600px] pr-1">
                  <div className="space-y-3">
                    {data.batch.map((batch: any) => (
                      <div key={batch.id} className="overflow-hidden rounded-lg border bg-background">
                        {/* Batch header */}
                        <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-5 py-3">
                          <span className="text-sm font-semibold">{batch.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {batch.batch_articles?.length ?? 0} artículo{batch.batch_articles?.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Articles */}
                        <div className="divide-y">
                          {batch.batch_articles?.map((article: any, idx: number) => {
                            const certs: string[] = Array.isArray(article.certificates)
                              ? article.certificates
                              : typeof article.certificates === 'string' && article.certificates
                                ? [article.certificates]
                                : [];
                            const articleDocs = [...(article.image ? [article.image] : []), ...certs];
                            const unitLabel = getUnitLabel(article.unit);

                            return (
                              <div key={`${article.article_part_number}-${idx}`} className="p-5">
                                <div className="flex flex-col gap-5 lg:flex-row">
                                  {/* Article info */}
                                  <div className="flex-1 space-y-4">
                                    {/* Identity row */}
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-muted/30">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <p className="font-mono text-sm font-semibold">
                                          {article.article_part_number || `Artículo ${idx + 1}`}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                          Cantidad:{' '}
                                          <span className="font-semibold text-foreground">{article.quantity}</span>
                                          {unitLabel && <> · {unitLabel}</>}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Fields grid */}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                                      {article.article_part_number && (
                                        <InfoCell label="N° Parte" value={article.article_part_number} mono />
                                      )}
                                      {article.article_alt_part_number && (
                                        <InfoCell label="N° Parte Alt." value={article.article_alt_part_number} mono />
                                      )}
                                      {article.aircraft && <InfoCell label="Aeronave" value={article.aircraft} mono />}
                                      {article.manual && <InfoCell label="Manual" value={article.manual} mono />}
                                      {article.reference_cod && (
                                        <InfoCell label="Cód. Referencia" value={article.reference_cod} mono />
                                      )}
                                      {article.pma && <InfoCell label="PMA" value={article.pma} />}
                                    </div>

                                    {article.justification && (
                                      <div className="space-y-1">
                                        <FieldLabel>Justificación del artículo</FieldLabel>
                                        <p className="text-sm text-muted-foreground">{article.justification}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Article docs */}
                                  {articleDocs.length > 0 && (
                                    <div className="w-full shrink-0 space-y-2 lg:w-52">
                                      <FieldLabel>Docs. del artículo</FieldLabel>
                                      {articleDocs.map((d, i) => (
                                        <DocPreview key={`${d}-${i}`} path={d} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
            )}
          </div>

          {/* ── Right column: Documents ── */}
          <div className="lg:col-span-4">
            <div className="rounded-lg border bg-background lg:sticky lg:top-4">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <FieldLabel>Documentos adjuntos</FieldLabel>
                {requisitionDocs.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                    {requisitionDocs.length}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                {requisitionDocs.length > 0 ? (
                  requisitionDocs.map((d, idx) => <DocPreview key={`${d}-${idx}`} path={d} />)
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted/20">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Sin documentos adjuntos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentLayout>
  );
};

export default RequisitionPage;
