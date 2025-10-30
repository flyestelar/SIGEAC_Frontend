'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useImportInventory } from '@/actions/sistema/carga_almacen/actions';
import { toast } from 'sonner';
import { ContentLayout } from '@/components/layout/ContentLayout';

export default function InventoryUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { useParams } = require('next/navigation');
  const params = useParams?.() as { company?: string } | undefined;

  const { importInventory, progress, setProgress } = useImportInventory();

  const allowed = useMemo(
    () => [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ],
    []
  );

  const onSelect = useCallback(
    (f: File) => {
      if (!allowed.includes(f.type) && !/\.(xlsx|xls|csv)$/i.test(f.name)) {
        toast('Formato inválido', { description: 'Usa .xlsx, .xls o .csv' });
        setFile(null);
        return;
      }
      if (f.size > 15 * 1024 * 1024) {
        toast('Archivo muy grande', { description: 'Máximo 15 MB' });
        setFile(null);
        return;
      }
      setFile(f);
    },
    [allowed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onSelect(e.dataTransfer.files[0]);
      }
    },
    [onSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onSelect(f);
    },
    [onSelect]
  );

  const handleUpload = useCallback(() => {
    if (!file) return;
    setProgress(5);
    importInventory.mutate(
      { file, company: params?.company ?? 'estelar', extra: {} },
      {
        onSuccess: () => {
          setFile(null);
          if (inputRef.current) inputRef.current.value = '';
          setTimeout(() => setProgress(0), 600);
        },
        onError: () => {
          setTimeout(() => setProgress(0), 600);
        },
      }
    );
  }, [file, importInventory, params?.company, setProgress]);

  const uploading = importInventory.isPending;

  return (
    <ContentLayout title="Carga de Inventario">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Cargar inventario
            </CardTitle>
            <CardDescription>Importa tu Excel al sistema. Formatos: .xlsx, .xls, .csv. Límite 15 MB.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dropzone */}
            <div
              onDragEnter={() => setDragActive(true)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center transition',
                dragActive ? 'border-foreground/60 bg-muted/30' : 'border-muted-foreground/30 bg-muted/20',
              ].join(' ')}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-muted-foreground/20">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm">Arrastra y suelta tu archivo aquí</p>
              <p className="text-xs text-muted-foreground">o</p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                  Seleccionar archivo
                </Button>
                <Input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleChange} className="hidden" />
              </div>

              {file && (
                <div className="mt-4 w-full rounded-lg border border-muted p-3 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Quitar archivo">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {uploading && (
                    <div className="mt-3">
                      <Progress value={progress} />
                      <p className="mt-2 text-xs text-muted-foreground">Cargando {progress}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-muted p-3 text-xs">
                <p className="font-medium">Requisitos de columnas</p>
                <p className="mt-1">
                  Ej.: <code>part_number</code>, <code>description</code>, <code>category</code>, <code>quantity</code>,{' '}
                  <code>uom</code>, <code>location</code>.
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-xs">
                <p className="font-medium">Validaciones</p>
                <p className="mt-1">Extensiones válidas y límite de 15 MB.</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={handleUpload} disabled={!file || uploading}>
              Importar inventario
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" asChild>
              <a href="/templates/inventory_template.xlsx">Descargar plantilla</a>
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">v3 • Integrado con React Query + Axios</div>
      </section>
    </ContentLayout>
  );
}
