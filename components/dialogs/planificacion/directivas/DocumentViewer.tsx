'use client';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Loader2
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DEFAULT_ZOOM, DocumentViewerToolbar } from './DocumentViewerToolbar';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

type ViewMode = 'single' | 'continuous';
export default function DocumentViewer({ url }: { url: string | undefined }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [viewerWidth, setViewerWidth] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const [loadError, setLoadError] = useState<string | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const setViewerContainerNode = useCallback((node: HTMLDivElement | null) => {
    viewerContainerRef.current = node;

    if (node) {
      setViewerWidth(Math.floor(node.getBoundingClientRect().width));
    }
  }, []);

  useEffect(() => {
    const element = viewerContainerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setViewerWidth(Math.floor(element.getBoundingClientRect().width));
    };

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const basePageWidth = useMemo(() => {
    if (!viewerWidth) {
      return 720;
    }

    return Math.max(Math.min(viewerWidth - 72, 1040), 280);
  }, [viewerWidth]);

  const renderedPageWidth = useMemo(() => {
    return Math.max(Math.floor(basePageWidth * (zoom / 100)), 280);
  }, [basePageWidth, zoom]);

  const hasDocument = Boolean(url);
  const isContinuousMode = viewMode === 'continuous';

  return (
    <>
      <div
        ref={setViewerContainerNode}
        className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.08),transparent_35%),linear-gradient(180deg,rgba(148,163,184,0.10),rgba(148,163,184,0.04))] p-3 sm:p-5"
      >
        <DocumentViewerToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          numPages={numPages}
          isContinuousMode={isContinuousMode}
          pageInput={pageInput}
          setPageInput={setPageInput}
          zoom={zoom}
          setZoom={setZoom}
          onResetView={() => {
            setCurrentPage(1);
            setPageInput('1');
            setZoom(DEFAULT_ZOOM);
            setViewMode('single');
          }}
          hasDocument={hasDocument}
          url={url}
          focusPage={(page) => {
            requestAnimationFrame(() => {
              pageRefs.current[page]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }}
        />

        {!hasDocument ? (
          <div className="grid h-full min-h-[420px] place-items-center rounded-[28px] border border-dashed bg-background/95 p-8 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium">Documento no disponible</p>
              <p className="text-sm text-muted-foreground">Esta directiva todavía no tiene un PDF asociado.</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="grid h-full min-h-[420px] place-items-center rounded-[28px] border border-dashed bg-background/95 p-8 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium">No se pudo visualizar el PDF</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <div className="pt-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    Abrir documento fuera del visor
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-full items-start justify-center">
            <Document
              key={url}
              file={url}
              loading={
                <div className="flex min-h-[420px] items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando PDF...
                </div>
              }
              onLoadSuccess={({ numPages: nextNumPages }) => {
                setNumPages(nextNumPages);
                setCurrentPage(1);
                setPageInput('1');
                setLoadError(null);
              }}
              onLoadError={(error) => {
                setNumPages(0);
                setPageInput('1');
                setLoadError(error.message || 'Error al cargar el documento.');
              }}
              error="No se pudo cargar el documento."
            >
              {isContinuousMode ? (
                Array.from({ length: numPages }, (_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <div
                      key={pageNumber}
                      ref={(node) => {
                        pageRefs.current[pageNumber] = node;
                      }}
                      className={cn(
                        'mx-auto mb-6 w-fit rounded-sm border bg-white p-3 transition-colors sm:p-4',
                        currentPage === pageNumber ? 'border-sky-500/40' : 'border-border/80',
                      )}
                      onClick={() => {
                        setCurrentPage(pageNumber);
                        setPageInput(String(pageNumber));
                      }}
                    >
                      <Page pageNumber={pageNumber} width={renderedPageWidth} />
                    </div>
                  );
                })
              ) : (
                <div className="mt-14 w-fit rounded-sm border border-border/80 bg-white p-3 sm:p-4">
                  <Page pageNumber={currentPage} width={renderedPageWidth} />
                </div>
              )}
            </Document>
          </div>
        )}
      </div>
    </>
  );
}
