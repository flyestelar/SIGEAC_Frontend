'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EyeIcon, FileText, Loader2, ExternalLink } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const actualFileName = typeof fileName === 'string' ? fileName.trim() : null;

  const {
    data: privateDocumentUrl,
    isLoading,
    error,
    refetch,
  } = useGetDocument({
    company: selectedCompany?.slug,
    fileName: actualFileName || '',
    enabled: !isPublic && isOpen,
  });

  const getPublicDocumentUrl = (): string => {
    if (!actualFileName) return '';
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || '';
    const cleanFileName = actualFileName.startsWith('/') ? actualFileName.substring(1) : actualFileName;
    return `${baseUrl}${cleanFileName}`;
  };

  useEffect(() => {
    if (isOpen && !isPublic && actualFileName && selectedCompany?.slug && !hasFetched) {
      refetch();
      setHasFetched(true);
    }
    if (!isOpen) {
      setHasFetched(false);
    }
  }, [isOpen, isPublic, actualFileName, selectedCompany?.slug, refetch, hasFetched]);

  const documentUrl = isPublic ? getPublicDocumentUrl() : isOpen ? privateDocumentUrl : null;

  // Detectar si es una URL de zrok.io
  const isZrokUrl = documentUrl?.includes('zrok.io') || documentUrl?.includes('share.zrok.io');

  // Detectar si es un PDF
  const isPdf =
    documentUrl?.toLowerCase().endsWith('.pdf') ||
    documentUrl?.includes('.pdf') ||
    documentUrl?.includes('application/pdf');

  if (!actualFileName) return null;

  const handleOpenExternal = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-10 gap-2', className)} title="Ver documento">
          {title} <EyeIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isPdf ? 'Documento PDF' : 'Documento'}
              </div>

              {/* Botón para abrir externamente si es zrok */}
              {isZrokUrl && documentUrl && (
                <Button variant="outline" size="sm" onClick={handleOpenExternal} className="gap-2">
                  Abrir en nueva pestaña
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col h-[70vh]">
          {!isPublic && isLoading ? (
            <div className="flex flex-col justify-center items-center h-full">
              <Loader2 className="h-10 w-10 animate-spin text-gray-500 mb-4" />
              <span>Cargando documento...</span>
            </div>
          ) : !isPublic && error ? (
            <div className="flex flex-col justify-center items-center h-full text-red-500">
              <p className="text-lg font-medium mb-2">Error</p>
              <p>{error.message.includes('404') ? 'Documento no encontrado' : 'Error al cargar el documento'}</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : documentUrl ? (
            <>
              {isZrokUrl ? (
                // Para URLs de zrok, mostramos un mensaje y botón
                <div className="flex flex-col justify-center items-center h-full text-center p-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">Documento externo</h3>
                    <p className="text-yellow-700 mb-4">
                      Este documento está alojado en un servicio externo con restricciones de seguridad. Para
                      visualizarlo, debes abrirlo en una nueva pestaña.
                    </p>
                    <div className="space-y-3">
                      <Button onClick={handleOpenExternal} className="w-full gap-2">
                        Abrir documento en nueva pestaña
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-gray-500">
                        URL: <span className="font-mono text-xs break-all">{documentUrl}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : isPdf ? (
                // Para PDFs normales (no zrok), usamos iframe
                <div className="relative flex-1 overflow-hidden rounded-lg bg-gray-50 border">
                  <iframe
                    src={documentUrl}
                    width="100%"
                    height="100%"
                    className="min-h-[500px]"
                    title={`Documento: ${actualFileName}`}
                  />
                </div>
              ) : (
                // Para otros tipos de contenido (imágenes, etc.)
                <div className="relative flex-1 overflow-hidden rounded-lg bg-gray-50 border">
                  <iframe
                    src={documentUrl}
                    width="100%"
                    height="100%"
                    className="min-h-[500px]"
                    title={`Documento: ${actualFileName}`}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">No hay documento disponible</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentDisplayDialog;
