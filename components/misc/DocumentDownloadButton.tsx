'use client';

import { Button } from '@/components/ui/button';
import { planificationWorkOrderDocumentDownload } from '@api/index';
import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function isAxiosError(error: unknown): error is { response?: { status?: number } } {
  return typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object';
}

export type DocumentType = 'work_order' | 'tally_sheet';

const DOCUMENT_LABELS: Record<DocumentType, { queue: string; retry: string; download: string; fileName: string }> = {
  work_order: {
    queue: 'Generar Documento',
    retry: 'Reintentar Documento',
    download: 'Descargar Documento',
    fileName: 'orden-trabajo',
  },
  tally_sheet: {
    queue: 'Generar Tally',
    retry: 'Reintentar Tally',
    download: 'Descargar Tally',
    fileName: 'tally-sheet',
  },
};

type DocumentDownloadButtonProps = {
  type: DocumentType;
  orderNumber: string;
  generationId: string | null;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
  onQueue: () => void;
  disabled?: boolean;
  autoDownload?: boolean;
};

export function DocumentDownloadButton({
  type,
  orderNumber,
  generationId,
  isCompleted,
  isFailed,
  isPending,
  onQueue,
  disabled = false,
  autoDownload = false,
}: DocumentDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const buttonLabel = isCompleted
    ? DOCUMENT_LABELS[type].download
    : isFailed
      ? DOCUMENT_LABELS[type].retry
      : DOCUMENT_LABELS[type].queue;
  const fileName = useMemo(
    () => `${DOCUMENT_LABELS[type].fileName}-${orderNumber}.pdf`,
    [orderNumber, type],
  );

  const downloadPdf = useCallback(async () => {
    if (!generationId) return;
    setIsDownloading(true);

    try {
      const response = await planificationWorkOrderDocumentDownload({
        path: { generation_id: generationId },
        throwOnError: true,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente.');
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        toast.error('Documento no encontrado (404). Verifique si la generación fue exitosa.');
      } else {
        toast.error('Error al descargar el PDF.');
      }
    } finally {
      setIsDownloading(false);
    }
  }, [fileName, generationId]);

  useEffect(() => {
    if (autoDownload && isCompleted && generationId) {
      downloadPdf();
    }
  }, [autoDownload, downloadPdf, generationId, isCompleted]);

  const handleClick = () => {
    if (isCompleted) {
      downloadPdf();
      return;
    }
    onQueue();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="min-w-52 h-8 gap-1.5 text-xs"
      onClick={handleClick}
      disabled={disabled || isPending || isDownloading}
    >
      <Download className="size-3.5" />
      {buttonLabel}
    </Button>
  );
}
