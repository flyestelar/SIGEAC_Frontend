'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronDown,
  Loader2,
  MapPin,
  MoreHorizontal,
  PackageSearch,
  Plane,
  Search,
  SquarePen,
  Wrench,
} from 'lucide-react';

import { ContentLayout } from '@/components/layout/ContentLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { articleListInfiniteOptions } from '@api/queries';
import { useDebounce } from '@/hooks/helpers/useDebounce';

import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import type { ArticleListItemResource } from '@api/types';

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
}

function fmtNumber(value: number | string | null | undefined, digits = 1) {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function conditionPalette(name?: string | null) {
  const key = (name ?? '').toUpperCase();
  if (/SERVICEABLE|NEW|NS/.test(key))
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (/REPAIR|OVERHAUL|OH/.test(key))
    return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
  if (/UNSERV|BER|SCRAP|REJECT/.test(key))
    return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400';
}

// ─── Skeleton ──────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 bg-background">
      <div className="flex items-center justify-between px-4 pt-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="mx-4 mt-3 border-t border-border/40" />
      <div className="space-y-3 px-4 py-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────
function MountedCard({ article }: { article: ArticleListItemResource }) {
  const router = useRouter();
  const { selectedCompany } = useCompanyStore();
  const inst = article.aircraft_part?.active_installation;
  const slot = inst?.aircraft_slot;
  const aircraft = slot?.aircraft;
  const cond = article.condition;

  const hAtInstall =
    fmtNumber(inst?.component_hours_at_install, 1) ?? fmtNumber(inst?.aircraft_hours_at_install, 1) ?? '—';
  const cAtInstall =
    fmtNumber(inst?.component_cycles_at_install, 0) ?? fmtNumber(inst?.aircraft_cycles_at_install, 0) ?? '—';
  const hTotal = fmtNumber(article.aircraft_part?.total_flight_hours, 1) ?? '—';
  const cTotal = fmtNumber(article.aircraft_part?.total_flight_cycles, 0) ?? '—';

  return (
    <div className="rounded-lg border border-border/60 border-l-4 border-l-sky-500 bg-background transition-colors hover:bg-muted/[0.03]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-semibold text-foreground truncate">
            {article.part_number ?? '—'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            SN {article.serial ?? '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              conditionPalette(cond?.name),
            )}
          >
            {cond?.name ?? '—'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() =>
                  router.push(`/${selectedCompany?.slug}/almacen/inventario/editar/${article.id}`)
                }
              >
                <SquarePen className="h-4 w-4 text-muted-foreground" />
                Editar artículo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {article.description && (
        <p className="px-4 pt-1.5 text-[13px] leading-snug text-foreground/80 line-clamp-2">
          {article.description}
        </p>
      )}

      <div className="mx-4 mt-3 border-t border-border/40" />

      {/* Installation info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-4">
        {/* Aircraft + Slot */}
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Aeronave / Slot
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-foreground">
              {aircraft?.acronym ?? '—'}
            </span>
            {slot?.position && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <MapPin className="size-3" />
                {slot.position}
              </span>
            )}
          </div>
        </div>

        {/* Installation date */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Instalado
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <CalendarDays className="size-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm font-medium text-foreground">
              {fmtDate(inst?.installed_at)}
            </span>
          </div>
        </div>

        {/* FH/FC at install */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Al instalar
          </p>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-sm tabular-nums">
            <span className="font-medium text-foreground">{hAtInstall} h</span>
            <span className="text-muted-foreground">{cAtInstall} c</span>
          </div>
        </div>

        {/* Total FH/FC */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Acumulados
          </p>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-sm tabular-nums">
            <span className="font-medium text-foreground">{hTotal} h</span>
            <span className="text-muted-foreground">{cTotal} c</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────
const MountedPage = () => {
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const { data, isLoading, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      ...articleListInfiniteOptions({
        query: {
          status: 'INUSE',
          with_installed_part: true,
          per_page: 20,
          search: debouncedSearch.trim() || null,
        },
        querySerializer(params) {
          return Object.entries(params)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => {
              if (typeof value === 'boolean') value = +value;
              return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
            })
            .join('&');
        },
      }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const meta = lastPage.meta;
        return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
      },
    });

  const rows = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta?.total ?? 0;

  return (
    <ContentLayout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-lg border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
              <Plane className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Componentes actualmente instalados en aeronaves
              </p>
              <p className="text-xs text-muted-foreground">
                Busca por serial, part number, descripción o aeronave para localizar componentes montados.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Serial, P/N o descripción..."
              className="h-9 pl-9"
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border bg-background p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/5">
              <PackageSearch className="size-6 text-red-500/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Error al cargar componentes</p>
              <p className="text-xs text-muted-foreground">
                No se pudieron obtener los datos. Reintenta o contacta al administrador.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <Loader2 className="mr-1.5 size-3.5" />
              Reintentar
            </Button>
          </div>
        ) : rows.length === 0 && debouncedSearch.trim() ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border bg-background p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/10">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Sin resultados</p>
              <p className="text-xs text-muted-foreground">
                No se encontraron componentes que coincidan con &ldquo;{debouncedSearch.trim()}&rdquo;.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>
              Limpiar búsqueda
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border bg-background p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-muted/10">
              <Wrench className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Sin componentes montados</p>
              <p className="text-xs text-muted-foreground">
                No hay componentes instalados en aeronaves en este momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {total > 0 && (
              <Badge variant="outline" className="h-6 gap-1.5 border-border/60 px-2 font-mono text-[11px]">
                <Plane className="size-3 text-muted-foreground" />
                {total} montado{total !== 1 && 's'}
              </Badge>
            )}

            {rows.map((article) => (
              <MountedCard key={article.id} article={article} />
            ))}

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 text-xs"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                  Ver más
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default MountedPage;
