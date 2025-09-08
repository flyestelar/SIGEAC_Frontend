'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { FileText, RotateCcw, Upload, X } from 'lucide-react';

const schema = z.object({
  files: z
    .custom<FileList>()
    .refine((v) => v && v.length > 0, 'Selecciona al menos un PDF')
    .refine((v) => Array.from(v || []).every((f) => f.type === 'application/pdf'), 'Sólo PDF'),
});
type FormValues = z.infer<typeof schema>;

type ItemStatus = 'queued' | 'uploading' | 'done' | 'error' | 'canceled';
type Item = {
  id: string;
  file: File;
  progress: number;
  status: ItemStatus;
  error?: string | null;
  abort?: AbortController;
};

function prettyBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

async function uploadPdf({
  endpoint,
  file,
  signal,
  onProgress,
}: {
  endpoint: string;
  file: File;
  signal: AbortSignal;
  onProgress?: (pct: number) => void;
}) {
  const form = new FormData();
  form.append('files[]', file, file.name);

  const config: AxiosRequestConfig = {
    method: 'POST',
    url: endpoint,
    data: form,
    signal,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (!evt.total) return;
      onProgress?.(Math.round((evt.loaded / evt.total) * 100));
    },
  };

  const res = await axiosInstance.request(config);
  return res.data;
}

export default function UploadDirectivePdfsForm({
  className,
  onDone,
  parallel = true, // si prefieres en serie pon false
}: {
  className?: string;
  parallel?: boolean;
  onDone?: (summary: { total: number; ok: number; failed: number; canceled: number }) => void;
}) {
  const { selectedCompany } = useCompanyStore();
  const endpoint = `https://15ajawh8h32a.share.zrok.io/api/${selectedCompany?.slug}/ingest`;
  const qc = useQueryClient();

  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Mutación de React Query: sube UN archivo (recibe variables)
  const mutation = useMutation({
    mutationFn: uploadPdf,
    onSuccess: () => {
      // invalida la lista para refrescar la tabla de directivas
      qc.invalidateQueries({ queryKey: ['extractions', selectedCompany] });
    },
  });

  const queued = useMemo(() => items.filter((i) => i.status === 'queued'), [items]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const toAdd = Array.from(list).map<Item>((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${crypto.randomUUID()}`,
      file: f,
      progress: 0,
      status: 'queued',
    }));
    setItems((prev) => [...prev, ...toAdd]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const cancelItem = (id: string) =>
    setItems((prev) =>
      prev.map((x) => {
        if (x.id === id && x.status === 'uploading' && x.abort) {
          try {
            x.abort.abort();
          } catch {}
          return { ...x, status: 'canceled', abort: undefined };
        }
        return x;
      }),
    );

  const clearCompleted = () => setItems((prev) => prev.filter((x) => !['done', 'canceled'].includes(x.status)));

  const uploadOne = async (it: Item) => {
    const controller = new AbortController();
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, status: 'uploading', abort: controller } : x)));

    try {
      await mutation.mutateAsync({
        endpoint,
        file: it.file,
        signal: controller.signal,
        onProgress: (pct) => setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, progress: pct } : x))),
      });

      setItems((prev) =>
        prev.map((x) => (x.id === it.id ? { ...x, status: 'done', progress: 100, abort: undefined } : x)),
      );
    } catch (err: any) {
      const wasAbort = err?.code === 'ERR_CANCELED';
      setItems((prev) =>
        prev.map((x) =>
          x.id === it.id
            ? {
                ...x,
                status: wasAbort ? 'canceled' : 'error',
                abort: undefined,
                error: wasAbort ? null : err?.response?.data || err?.message || 'Error',
              }
            : x,
        ),
      );
    }
  };

  const uploadAll = async () => {
    const toUpload = items.filter((i) => i.status === 'queued');
    if (!toUpload.length) return;
    if (parallel) {
      await Promise.all(toUpload.map((it) => uploadOne(it)));
    } else {
      for (const it of toUpload) {
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(it);
      }
    }
    onDone?.({
      total: items.length,
      ok: items.filter((i) => i.status === 'done').length,
      failed: items.filter((i) => i.status === 'error').length,
      canceled: items.filter((i) => i.status === 'canceled').length,
    });
  };

  const retryItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'queued', progress: 0, error: null } : x)));
    uploadOne({ ...it, status: 'queued', progress: 0, error: null });
  };

  // Submit RHF: agrega a la cola (no sube aún)
  const onSubmit = async (values: FormValues) => {
    addFiles(values.files);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      {/* Selector de archivos */}
      <Controller
        control={control}
        name="files"
        render={({ field }) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                ref={(r) => ((inputRef as any).current = r)}
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => field.onChange(e.target.files)}
              />
              <Button type="submit" className="gap-2">
                <Upload className="h-4 w-4" /> Añadir a la cola
              </Button>
            </div>
          </div>
        )}
      />

      {/* Acciones globales */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {items.length} archivo(s) · {queued.length} en cola
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={uploadAll} disabled={!queued.length}>
              Subir todo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearCompleted}
              disabled={!items.some((i) => ['done', 'canceled'].includes(i.status))}
            >
              Limpiar completados
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2 max-h-80 overflow-auto pr-1">
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border p-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between">
                <span className="truncate font-medium">{it.file.name}</span>
                <span className="text-xs text-muted-foreground">{prettyBytes(it.file.size)}</span>
              </div>
              <Progress value={it.progress} className="mt-2" />
              <div className="mt-1 flex justify-between text-xs">
                <div>
                  {it.status === 'queued' && <Badge>En cola</Badge>}
                  {it.status === 'uploading' && <Badge variant="secondary">Subiendo…</Badge>}
                  {it.status === 'done' && <Badge>Completado</Badge>}
                  {it.status === 'error' && <Badge variant="destructive">Error</Badge>}
                  {it.status === 'canceled' && <Badge variant="outline">Cancelado</Badge>}
                </div>
                <span>{it.progress}%</span>
              </div>
              {it.error && <div className="text-xs text-destructive">{it.error}</div>}
            </div>

            <Separator orientation="vertical" className="h-10 mx-1" />

            <div className="flex flex-col gap-2">
              {it.status === 'queued' && (
                <Button size="sm" variant="outline" onClick={() => uploadOne(it)}>
                  Subir
                </Button>
              )}
              {it.status === 'uploading' && (
                <Button size="sm" variant="outline" onClick={() => cancelItem(it.id)}>
                  Cancelar
                </Button>
              )}
              {it.status === 'error' && (
                <Button size="sm" variant="outline" onClick={() => retryItem(it.id)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reintentar
                </Button>
              )}
              {(it.status === 'queued' ||
                it.status === 'done' ||
                it.status === 'error' ||
                it.status === 'canceled') && (
                <Button size="sm" variant="ghost" onClick={() => removeItem(it.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
