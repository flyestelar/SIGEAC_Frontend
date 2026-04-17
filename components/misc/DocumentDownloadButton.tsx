'use client';

import { Button } from '@/components/ui/button';
import { planificationWorkOrderDocumentDownload } from '@api/index';
import { Download } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

function isAxiosError(error: unknown): error is { response?: { status?: number } } {
  return (
    typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object'
  );
}

export type DocumentType = 'work_order' | 'tally_sheet';

const DOCUMENT_LABELS: Record<
  DocumentType,
  { queue: string; retry: string; download: string; fileName: string; regenerate: string }
> = {
  work_order: {
    queue: 'Generar Documento',
    retry: 'Reintentar Documento',
    download: 'Descargar Documento',
    fileName: 'orden-trabajo',
    regenerate: 'Regenerar Documento',
  },
  tally_sheet: {
    queue: 'Generar Tally',
    retry: 'Reintentar Tally',
    download: 'Descargar Tally',
    fileName: 'tally-sheet',
    regenerate: 'Regenerar Tally',
  },
};

type DocumentDownloadButtonProps = {
  type: DocumentType;
  orderNumber: string;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
  onQueue: () => void;
  disabled?: boolean;
  stale?: boolean;
};

export function DocumentDownloadButton({
  type,
  orderNumber,
  isCompleted,
  isFailed,
  isPending,
  onQueue,
  disabled = false,
  stale,
}: DocumentDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const labels = DOCUMENT_LABELS[type];
  const buttonLabel = stale
    ? labels.regenerate
    : isCompleted
      ? labels.download
      : isFailed
        ? labels.retry
        : labels.queue;
  const fileName = `${labels.fileName}-${orderNumber}.pdf`;

  const downloadPdf = useCallback(async () => {
    setIsDownloading(true);

    try {
      const response = await planificationWorkOrderDocumentDownload({
        path: { order_number: orderNumber, document_type: type },
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
  }, [fileName, orderNumber, type]);

  // Downloads are initiated only on explicit user click (see handleClick)

  const handleClick = () => {
    if (stale) {
      onQueue();
      return;
    }

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
