'use client';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Rows3,
  ScanLine,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 60;
const MAX_ZOOM = 200;

type ViewMode = 'single' | 'continuous';
export default function DocumentViewer({ url, adNumber }: { url: string | undefined; adNumber: string }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [viewerWidth, setViewerWidth] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [fitToWidth, setFitToWidth] = useState(true);
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
    if (fitToWidth) {
      return basePageWidth;
    }

    return Math.max(Math.floor(basePageWidth * (zoom / 100)), 280);
  }, [basePageWidth, fitToWidth, zoom]);

  const goToPage = useCallback(
    (page: number) => {
      const nextPage = Math.min(Math.max(page, 1), Math.max(numPages, 1));
      setCurrentPage(nextPage);
      setPageInput(String(nextPage));

      if (viewMode === 'continuous') {
        requestAnimationFrame(() => {
          pageRefs.current[nextPage]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    },
    [numPages, viewMode],
  );

  const handlePageInputCommit = useCallback(() => {
    const parsedPage = Number(pageInput);

    if (!Number.isFinite(parsedPage)) {
      setPageInput(String(currentPage));
      return;
    }

    goToPage(parsedPage);
  }, [currentPage, goToPage, pageInput]);

  const adjustZoom = useCallback((delta: number) => {
    setFitToWidth(false);
    setZoom((currentZoom) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + delta)));
  }, []);

  const resetView = useCallback(() => {
    setCurrentPage(1);
    setPageInput('1');
    setZoom(DEFAULT_ZOOM);
    setFitToWidth(true);
    setViewMode('single');
    setLoadError(null);
  }, []);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < numPages;
  const hasDocument = Boolean(url);
  const isContinuousMode = viewMode === 'continuous';

  const pageStatusLabel = numPages > 0 ? `Página ${currentPage} de ${numPages}` : 'Preparando documento';

  return (
    <>
      <div
        ref={setViewerContainerNode}
        className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.08),transparent_35%),linear-gradient(180deg,rgba(148,163,184,0.10),rgba(148,163,184,0.04))] p-3 sm:p-5"
      >
        <div className="pointer-events-none sticky top-3 z-20 flex justify-center px-2">
          <TooltipProvider delayDuration={100}>
            <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background/92 px-2 py-2 backdrop-blur">
              <div className="rounded-xl border bg-muted/35 p-0.5">
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => {
                    if (value === 'single' || value === 'continuous') {
                      setViewMode(value);
                    }
                  }}
                  className="gap-0"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="single" aria-label="Modo página" className="h-8 w-8 rounded-lg border-0">
                        <ScanLine className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Modo página</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="continuous"
                        aria-label="Modo continuo"
                        className="h-8 w-8 rounded-lg border-0"
                      >
                        <Rows3 className="h-3.5 w-3.5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Modo continuo</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </div>

              <div className="hidden items-center rounded-xl border px-2 py-1.5 md:flex">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {pageStatusLabel}
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!canGoPrevious || isContinuousMode}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="sr-only">Página anterior</span>
                </Button>
                <div className="flex items-center gap-1 rounded-lg bg-muted/40 px-2 py-1">
                  <Input
                    value={pageInput}
                    onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={handlePageInputCommit}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handlePageInputCommit();
                      }
                    }}
                    className="h-6 w-10 border-0 bg-transparent p-0 text-center font-mono text-xs focus-visible:ring-0"
                    inputMode="numeric"
                    aria-label="Ir a página"
                  />
                  <span className="text-[11px] text-muted-foreground">/ {numPages || '—'}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!canGoNext || isContinuousMode}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="sr-only">Página siguiente</span>
                </Button>
              </div>

              <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
                <Button
                  type="button"
                  variant={fitToWidth ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setFitToWidth((value) => !value)}
                >
                  Fit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustZoom(-10)}
                  disabled={fitToWidth || zoom <= MIN_ZOOM}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                  <span className="sr-only">Reducir zoom</span>
                </Button>
                <div className="min-w-12 text-center text-xs font-medium text-foreground/80">
                  {fitToWidth ? 'FIT' : `${zoom}%`}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustZoom(10)}
                  disabled={fitToWidth || zoom >= MAX_ZOOM}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  <span className="sr-only">Aumentar zoom</span>
                </Button>
              </div>

              <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-xs" onClick={resetView}>
                  Reset
                </Button>
                {hasDocument ? (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="sr-only">Abrir en una pestaña nueva</span>
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </TooltipProvider>
        </div>

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
                        'mx-auto mb-6 w-fit rounded-[28px] border bg-white p-3 transition-colors sm:p-4',
                        currentPage === pageNumber ? 'border-sky-500/40' : 'border-border/80',
                      )}
                      onClick={() => {
                        setCurrentPage(pageNumber);
                        setPageInput(String(pageNumber));
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <span>Hoja {pageNumber}</span>
                        <span>{adNumber}</span>
                      </div>
                      <Page
                        pageNumber={pageNumber}
                        width={renderedPageWidth}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="mt-14 w-fit rounded-[28px] border border-border/80 bg-white p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Hoja {currentPage}</span>
                    <span>{adNumber}</span>
                  </div>
                  <Page
                    pageNumber={currentPage}
                    width={renderedPageWidth}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
              )}
            </Document>
          </div>
        )}
      </div>
    </>
  );
}
