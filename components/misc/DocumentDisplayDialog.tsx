'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { EyeIcon, ExternalLink } from 'lucide-react';
import { useCompanyStore } from '@/stores/CompanyStore';
import { useGetDocument } from '@/hooks/archivos/useGetDocument';
import { cn } from '@/lib/utils';

interface DocumentDisplayDialogProps {
  fileName: string;
  isPublic?: boolean;
  className?: string;
  title?: string;
}

function DocumentDisplayDialog({ fileName, isPublic = false, title = 'Ver', className }: DocumentDisplayDialogProps) {
  const { selectedCompany } = useCompanyStore();
  const [documentUrl, setDocumentUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const actualFileName = typeof fileName === 'string' ? fileName.trim() : null;

  const { refetch } = useGetDocument({
    company: selectedCompany?.slug,
    fileName: actualFileName || '',
    enabled: false, // Deshabilitamos la carga automática
  });

  const getPublicDocumentUrl = (): string => {
    if (!actualFileName) return '';
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
    const cleanFileName = actualFileName.startsWith('/') ? actualFileName.substring(1) : actualFileName;
    return `${baseUrl}${cleanFileName}`;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!actualFileName) return;

    setIsLoading(true);

    try {
      let url: string;

      if (isPublic) {
        // URL pública directa
        url = getPublicDocumentUrl();
      } else {
        // Fetch la URL privada
        const result = await refetch();
        url = result.data || '';
      }

      if (url) {
        // ABRIR DIRECTAMENTE EN NUEVA PESTAÑA
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error al obtener documento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!actualFileName) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('h-10 gap-2', className)}
      title="Abrir documento en nueva pestaña"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          Cargando...
          <EyeIcon className="h-4 w-4 animate-pulse" />
        </>
      ) : (
        <>
          {title}
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export default DocumentDisplayDialog;
