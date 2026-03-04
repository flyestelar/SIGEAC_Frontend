'use client';

import { useDeleteRequisition } from '@/actions/mantenimiento/compras/requisiciones/actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGetRequisitionByOrderNumber } from '@/hooks/mantenimiento/compras/useGetRequisitionByOrderNumber';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ClipboardCheck, ExternalLink, FileText, Flag, Image as ImageIcon, Paperclip, Plane, User } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

/* =========================
   Config: base URL de documentos
   Ajusta a tu backend (muy importante)
========================= */
// Ejemplos válidos:
// https://api.midominio.com/storage
// https://midominio.com/storage
const DOC_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL!;

const joinUrl = (base: string, path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const b = base?.replace(/\/$/, '') || '';
  const p = path.replace(/^\//, '');
  return `${b}/${p}`;
};

const ext = (p: string) => (p.split('.').pop() || '').toLowerCase();
const isPdfPath = (p: string) => ext(p) === 'pdf';
const isImgPath = (p: string) => ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext(p));

const niceName = (path: string) => {
  try {
    const last = path.split('/').pop() || path;
    return decodeURIComponent(last);
  } catch {
    return path.split('/').pop() || path;
  }
};

const normalizeStatus = (s?: string) => (s ?? '').toString().trim().toLowerCase();
const statusBadge = (status?: string) => {
  const st = normalizeStatus(status);
  if (st.includes('aprob')) return { label: (status ?? '').toUpperCase(), cls: 'bg-green-600 hover:bg-green-600' };
  if (st.includes('rech')) return { label: (status ?? '').toUpperCase(), cls: 'bg-red-600 hover:bg-red-600' };
  return { label: (status ?? 'PROCESO').toUpperCase(), cls: 'bg-amber-600 hover:bg-amber-600' };
};

/* =========================
   Preview components
========================= */

function DocPreview({ path }: { path: string }) {
  const url = useMemo(() => joinUrl(DOC_BASE_URL, path), [path]);
  const name = useMemo(() => niceName(path), [path]);

  const openNewTab = () => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="rounded-2xl border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/30">
              {isPdfPath(path) ? (
                <FileText className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{isPdfPath(path) ? 'PDF' : 'Imagen'}</p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openNewTab}
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted/40"
          aria-label="Abrir"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 h-[320px] overflow-hidden rounded-xl border bg-muted/10">
        {isPdfPath(path) ? (
          <iframe
            src={url}
            className="h-full w-full"
            title={name}
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        ) : isImgPath(path) ? (
          <div className="relative h-full w-full">
            <Image
              src={url}
              alt={name}
              fill
              className="object-contain"
              // si tu servidor no está en next.config remotePatterns, usa unoptimized
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No se puede previsualizar este archivo. Ábrelo con el botón.
          </div>
        )}
      </div>
    </div>
  );
}

function DocGrid({ docs }: { docs: string[] }) {
  if (!docs?.length) {
    return (
      <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
        No hay documentos adjuntos.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {docs.map((d, idx) => (
        <DocPreview key={`${d}-${idx}`} path={d} />
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

/* =========================
   Page
========================= */

const RequisitionPage = () => {
  const [openDelete, setOpenDelete] = useState(false);
  const { selectedCompany } = useCompanyStore();
  const router = useRouter();
  const { order_number } = useParams<{ order_number: string }>();

  const { data, isLoading, isError } = useGetRequisitionByOrderNumber({
    company: selectedCompany?.slug,
    order_number,
  });

  const { deleteRequisition } = useDeleteRequisition();

  if (isLoading) return <LoadingPage />;

  if (isError || !data) {
    return (
      <ContentLayout title="Inventario">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-background p-6 text-center">
          <p className="text-base font-semibold">No se pudo cargar la requisición.</p>
          <p className="mt-1 text-sm text-muted-foreground">Intenta nuevamente o verifica el número.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        </div>
      </ContentLayout>
    );
  }

  const badge = statusBadge(data.status);
  const canDelete = !normalizeStatus(data.status).includes('aprob');

  const handleDelete = async (id: number) => {
    await deleteRequisition.mutateAsync({
      id,
      company: selectedCompany!.slug,
    });
    router.push(`/${selectedCompany!.slug}/general/requisiciones`);
  };

  // requisition documents are string[]
  const requisitionDocs: string[] = Array.isArray(data.document) ? data.document : [];

  return (
    <ContentLayout title="Inventario">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="rounded-2xl border bg-background/60 p-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Requisición <span className="text-blue-600">#{data.order_number}</span>
            </h1>
            <p className="text-sm text-muted-foreground">Estado y detalles de la requisición.</p>
            <Badge className={cn('mt-1 text-sm', badge.cls)}>{badge.label}</Badge>
          </div>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Summary */}
          <Card className="md:col-span-7 rounded-2xl border-muted/50 bg-background/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumen</CardTitle>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Fecha */}
                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Fecha de creación
                  </div>
                  <p className="mt-2 text-sm">{format(data.submission_date, 'PPP', { locale: es }) || 'N/A'}</p>
                </div>

                {/* Aeronave */}
                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    Aeronave
                  </div>
                  <p className="mt-2 text-sm font-semibold">{data.aircraft?.acronym || 'N/A'}</p>
                </div>

                {/* OT */}
                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    Orden de trabajo
                  </div>
                  <p className="mt-2 text-sm">{data.work_order ?? 'N/A'}</p>
                </div>

                {/* Prioridad */}
                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    Prioridad
                  </div>
                  <div className="mt-2">
                    {data.priority ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          data.priority === 'MEDIUM' || data.priority === 'LOW'
                            ? 'bg-yellow-500'
                            : 'bg-red-600 text-white',
                          'text-white',
                        )}
                      >
                        {String(data.priority).toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-sm">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Creado por
                  </div>
                  <p className="mt-2 text-sm">
                    {data.created_by?.first_name} {data.created_by?.last_name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{data.created_by?.email}</p>
                </div>

                <div className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Solicitado por
                  </div>
                  <p className="mt-2 text-sm">{data.requested_by}</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm font-semibold">Justificación</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {data.justification || 'No se proporcionó justificación.'}
                </p>
              </div>
              {/* Batches */}
              <div className="space-y-4">
                {data.batch?.map((batch: any) => (
                  <Card key={batch.id} className="rounded-2xl border-muted/50 bg-background/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-lg">{batch.name}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {batch.batch_articles?.length ?? 0} artículo(s)
                          </p>
                        </div>
                        <Badge variant="secondary" className="rounded-xl">
                          Lote
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {batch.batch_articles?.map((article: any, idx: number) => {
                        // Article docs:
                        // - image: string | null (path)
                        // - certificates: could be string[] or string or null
                        const certs: string[] = Array.isArray(article.certificates)
                          ? article.certificates
                          : typeof article.certificates === 'string' && article.certificates
                            ? [article.certificates]
                            : [];

                        const articleDocs = [...(article.image ? [article.image] : []), ...certs];

                        return (
                          <div
                            key={`${article.article_part_number}-${idx}`}
                            className="rounded-2xl border bg-background p-4"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              {/* Left */}
                              <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/30">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                      Artículo {idx + 1}
                                      {article.article_part_number ? ` • ${article.article_part_number}` : ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Cantidad: <span className="font-medium text-foreground">{article.quantity}</span>
                                    </p>
                                  </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <InfoRow label="N° Parte" value={article.article_part_number || 'N/A'} />
                                  <InfoRow label="N° Parte Alt" value={article.article_alt_part_number || 'N/A'} />
                                  <InfoRow label="Unidad" value={article.unit || 'N/A'} />
                                  <InfoRow label="Aeronave" value={article.aircraft || 'N/A'} />

                                  {article.manual ? <InfoRow label="Manual" value={article.manual} /> : null}
                                  {article.reference_cod ? (
                                    <InfoRow label="Cód. Referencia" value={article.reference_cod} />
                                  ) : null}
                                  {article.pma ? <InfoRow label="PMA" value={article.pma} /> : null}

                                  {article.justification ? (
                                    <div className="md:col-span-2">
                                      <p className="text-xs text-muted-foreground">Justificación</p>
                                      <p className="mt-1 text-sm">{article.justification}</p>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              {/* Right: docs preview */}
                              <div className="w-full md:w-[250px]">
                                {articleDocs.length ? (
                                  <DocGrid docs={articleDocs} />
                                ) : (
                                  <div className="flex h-[220px] items-center justify-center rounded-2xl border bg-muted/10 text-sm text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                      <ImageIcon className="h-8 w-8" />
                                      Sin documentos
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="md:col-span-5 rounded-2xl border-muted/50 bg-background/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">Documentos</CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/30">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">PDF e imágenes adjuntas.</p>
              {!DOC_BASE_URL ? (
                <p className="mt-1 text-xs text-red-600">
                  Falta DOC_BASE_URL. Define NEXT_PUBLIC_IMAGE_BASE_URL / NEXT_PUBLIC_STORAGE_URL / NEXT_PUBLIC_API_URL.
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <DocGrid docs={requisitionDocs} />
            </CardContent>
          </Card>
        </div>
        {/* <Card className="rounded-2xl border-muted/50 bg-background/60">
          <CardFooter className="flex items-center justify-end gap-2">
            <Button onClick={() => setOpenDelete(true)} variant="destructive" className={cn(!canDelete && 'hidden')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </CardFooter>
        </Card> */}
      </div>
      {/* <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">¿Eliminar requisición?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleDelete(data.id)}
              disabled={deleteRequisition.isPending}
              className={cn(!canDelete && 'hidden')}
            >
              {deleteRequisition.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </ContentLayout>
  );
};

export default RequisitionPage;
