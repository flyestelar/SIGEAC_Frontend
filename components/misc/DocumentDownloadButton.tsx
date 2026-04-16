'use client';

import { Button } from '@/components/ui/button';
import { planificationWorkOrderDocumentDownload } from '@api/index';
import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export type DocumentType = 'work_order' | 'tally_sheet';

const DOCUMENT_LABELS: Record<DocumentType, { queue: string; download: string; fileName: string }> = {
  work_order: {
    queue: 'Generar orden',
    download: 'Descargar orden',
    fileName: 'orden-trabajo',
  },
  tally_sheet: {
    queue: 'Generar tally',
    download: 'Descargar tally',
    fileName: 'tally-sheet',
  },
};

type DocumentDownloadButtonProps = {
  type: DocumentType;
  orderNumber: string;
  generationId: string | null;
  isCompleted: boolean;
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
  isPending,
  onQueue,
  disabled = false,
  autoDownload = false,
}: DocumentDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const buttonLabel = isCompleted ? DOCUMENT_LABELS[type].download : DOCUMENT_LABELS[type].queue;
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
      toast.error('Error al descargar el PDF.');
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
      className="h-8 gap-1.5 text-xs"
      onClick={handleClick}
      disabled={disabled || isPending || isDownloading}
    >
      <Download className="size-3.5" />
      {buttonLabel}
    </Button>
  );
}
