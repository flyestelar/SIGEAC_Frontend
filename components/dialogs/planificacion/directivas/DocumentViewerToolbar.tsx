import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ExternalLink, MaximizeIcon, Rows3, ScanLine, ZoomIn, ZoomOut } from 'lucide-react';

export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 60;
export const MAX_ZOOM = 200;
export type ViewMode = 'single' | 'continuous';

interface DocumentViewerToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  numPages: number | null;
  isContinuousMode: boolean;
  pageInput: string;
  setPageInput: (value: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onResetView: () => void;
  hasDocument: boolean;
  url?: string;
  focusPage: (page: number) => void;
}

export function DocumentViewerToolbar({
  viewMode,
  setViewMode,
  currentPage,
  numPages,
  isContinuousMode,
  pageInput,
  setPageInput,
  zoom,
  setZoom,
  hasDocument,
  onResetView,
  url,
  setCurrentPage,
  focusPage,
}: DocumentViewerToolbarProps) {
  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), Math.max(numPages ?? 0, 1));
    setCurrentPage(nextPage);
    setPageInput(String(nextPage));

    if (viewMode === 'continuous') {
      focusPage(nextPage);
    }
  };

  const handlePageInputCommit = () => {
    const parsedPage = Number(pageInput);

    if (!Number.isFinite(parsedPage)) {
      setPageInput(String(currentPage));
      return;
    }

    goToPage(parsedPage);
  };

  const adjustZoom = (delta: number) => {
    setZoom((currentZoom) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom + delta)));
  };

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < (numPages ?? 0);
  const pageStatusLabel = numPages ? null : 'Preparando documento';

  return (
    <div className="pointer-events-none sticky top-2 z-20 flex justify-center px-2">
      <TooltipProvider delayDuration={100}>
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background/92 px-2 py-2 backdrop-blur">
          <ToggleGroup
            className="rounded-xl border bg-muted/35 p-0.5 px-1"
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'single' || value === 'continuous') {
                setViewMode(value);
              }
            }}
          >
            <ToggleGroupItem size="sm" value="single" aria-label="Modo página" asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 min-w-0 aria-checked:bg-primary aria-checked:text-primary-foreground">
                <ScanLine className="h-3.5 w-3.5" />
              </Button>
            </ToggleGroupItem>

            <ToggleGroupItem size="sm" value="continuous" aria-label="Modo continuo" asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 min-w-0 aria-checked:bg-primary aria-checked:text-primary-foreground">
                <Rows3 className="h-3.5 w-3.5" />
              </Button>
            </ToggleGroupItem>
          </ToggleGroup>

          {pageStatusLabel ? (
            <div className="hidden items-center rounded-xl border px-2 py-1.5 md:flex">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {pageStatusLabel}
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!canGoPrevious || isContinuousMode}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <div className="flex items-center gap-1 rounded-lg bg-muted/40 px-2">
              <input
                name="document_page"
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/g, ''))}
                onBlur={handlePageInputCommit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handlePageInputCommit();
                  }
                }}
                className="h-auto w-8 border-0 bg-transparent p-0 text-center text-[11px] focus-visible:ring-0 focus-visible:outline-none focus:bg-secondary/50 rounded-md"
                inputMode="numeric"
                aria-label="Ir a página"
              />
              <span className="text-[11px] text-muted-foreground">/ {numPages || '—'}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!canGoNext || isContinuousMode}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="sr-only">Página siguiente</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setZoom(DEFAULT_ZOOM)}
                  aria-label="Ajustar ancho"
                >
                  <MaximizeIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Ajustar ancho</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Ajustar ancho</TooltipContent>
            </Tooltip>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => adjustZoom(-10)}
              disabled={zoom <= MIN_ZOOM}
            >
              <ZoomOut className="h-3.5 w-3.5" />
              <span className="sr-only">Reducir zoom</span>
            </Button>
            <div className="min-w-12 text-center text-xs font-medium text-foreground/80">{`${zoom}%`}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => adjustZoom(10)}
              disabled={zoom >= MAX_ZOOM}
            >
              <ZoomIn className="h-3.5 w-3.5" />
              <span className="sr-only">Aumentar zoom</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1">
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onResetView}>
              Reset
            </Button>
            {hasDocument ? (
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" asChild>
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
  );
}
