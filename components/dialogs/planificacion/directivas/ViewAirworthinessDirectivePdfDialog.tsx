'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const DocumentViewer = dynamic(() => import('./DocumentViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <svg
        className="mr-2 h-8 w-8 animate-spin text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Cargando PDF...
    </div>
  ),
});

type ViewAirworthinessDirectivePdfDialogProps = {
  adNumber: string;
  pdfUrl?: string;
};

export default function ViewAirworthinessDirectivePdfDialog({
  adNumber,
  pdfUrl,
}: ViewAirworthinessDirectivePdfDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = setOpen;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!pdfUrl} className="gap-2">
          <FileText className="h-4 w-4" />
          Ver PDF
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[94vh] max-w-[96vw] flex-col overflow-hidden border p-0 sm:rounded-2xl xl:max-w-7xl gap-0">
        <div className="border-b bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0.01))]">
          <DialogHeader className="gap-3 px-6 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                Documento técnico
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">AD {adNumber}</div>
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold tracking-tight">Visualizador de PDF</DialogTitle>
              <DialogDescription>
                Modo mixto con navegación por página, lectura continua, zoom y apertura externa.
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>
        <DocumentViewer url={pdfUrl} />
      </DialogContent>
    </Dialog>
  );
}
