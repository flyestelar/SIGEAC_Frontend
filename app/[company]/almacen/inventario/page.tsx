'use client';

import { CreateBatchDialog } from '@/components/dialogs/mantenimiento/almacen/CreateBatchDialog';
import { ContentLayout } from '@/components/layout/ContentLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useGetWarehouseArticlesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';
import { useInventoryExport } from '@/hooks/mantenimiento/almacen/reportes/useGetWarehouseReports';
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/CompanyStore';
import { TooltipArrow } from '@radix-ui/react-tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Package2, PaintBucket, Search, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { flattenArticles, getColumnsByCategory, IArticleSimple } from './columns';
import { DataTable } from './data-table';

type Category = 'COMPONENTE' | 'CONSUMIBLE' | 'HERRAMIENTA';

type ComponentCondition =
  | 'all'
  | 'SERVICIABLE'
  | 'REMOVIDO - NO SERVICIABLE'
  | 'REMOVIDO - CUSTODIA'
  | 'REMOVIDO - DESCARGADA'
  | 'REPARADO'
  | 'USADO'
  | 'NUEVO';

type ConsumableFilter = 'all' | 'QUIMICOS';

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: typeof Package2; accent: string; dot: string }
> = {
  COMPONENTE: {
    label: 'Componentes',
    icon: Package2,
    accent: 'data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300',
    dot: 'bg-sky-500',
  },
  CONSUMIBLE: {
    label: 'Consumibles',
    icon: PaintBucket,
    accent: 'data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  HERRAMIENTA: {
    label: 'Herramientas',
    icon: Wrench,
    accent: 'data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300',
    dot: 'bg-orange-500',
  },
};

const COMPONENT_CONDITIONS: { value: ComponentCondition; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'SERVICIABLE', label: 'Serviciables' },
  { value: 'REPARADO', label: 'Reparados' },
  { value: 'REMOVIDO - NO SERVICIABLE', label: 'Removidos · No Serviciables' },
  { value: 'REMOVIDO - CUSTODIA', label: 'Removidos · En custodia' },
];

const CONSUMABLE_FILTERS: { value: ConsumableFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'QUIMICOS', label: 'Químicos' },
];

const InventarioArticulosPage = () => {
  const { selectedCompany } = useCompanyStore();
  const { user } = useAuth();
  const { exporting, exportPdf, exportExcel } = useInventoryExport();

  const [activeCategory, setActiveCategory] = useState<Category>('COMPONENTE');
  const [componentCondition, setComponentCondition] = useState<ComponentCondition>('all');
  const [consumableFilter, setConsumableFilter] = useState<ConsumableFilter>('all');
  const [partNumberSearch, setPartNumberSearch] = useState('');

  const { data: articles, isLoading: isLoadingArticles } = useGetWarehouseArticlesByCategory(
    1,
    1000,
    activeCategory,
    true,
  );

  const exportPayload = useMemo(
    () => ({
      category: activeCategory,
      search: partNumberSearch,
      filters:
        activeCategory === 'COMPONENTE'
          ? { condition: componentCondition }
          : activeCategory === 'CONSUMIBLE'
            ? { group: consumableFilter }
            : {},
      filenamePrefix: 'inventario',
    }),
    [activeCategory, partNumberSearch, componentCondition, consumableFilter],
  );

  useEffect(() => {
    if (activeCategory !== 'COMPONENTE') setComponentCondition('all');
    if (activeCategory !== 'CONSUMIBLE') setConsumableFilter('all');
  }, [activeCategory]);

  const cols = useMemo(() => getColumnsByCategory(activeCategory), [activeCategory]);

  const flat = useMemo<IArticleSimple[]>(() => flattenArticles(articles) ?? [], [articles]);

  const currentData = useMemo<IArticleSimple[]>(() => {
    const q = partNumberSearch.trim().toLowerCase();
    const bySearch = q
      ? flat.filter(
          (a) =>
            a.part_number?.toLowerCase().includes(q) ||
            (Array.isArray(a.alternative_part_number) &&
              a.alternative_part_number.some((alt) => alt?.toLowerCase().includes(q))),
        )
      : flat;

    if (activeCategory === 'COMPONENTE' && componentCondition !== 'all') {
      return bySearch.filter((a) => a.condition === componentCondition);
    }

    if (activeCategory === 'CONSUMIBLE' && consumableFilter === 'QUIMICOS') {
      return bySearch.filter((a: any) => a.is_hazardous === true);
    }

    return bySearch;
  }, [flat, partNumberSearch, activeCategory, componentCondition, consumableFilter]);

  const userRoles = user?.roles?.map((role) => role.name) || [];
  const shouldEnableField = userRoles.some((role) => ['SUPERUSER'].includes(role));

  const handleClearSearch = () => setPartNumberSearch('');

  const activeCat = CATEGORY_CONFIG[activeCategory];
  const hasActiveSubFilter =
    (activeCategory === 'COMPONENTE' && componentCondition !== 'all') ||
    (activeCategory === 'CONSUMIBLE' && consumableFilter !== 'all');

  return (
    <ContentLayout title="Inventario">
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-col gap-y-6">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Inventario General</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header — left-aligned, dense */}
          <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Almacén · MRO
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">Inventario General</h1>
              <p className="text-sm text-foreground/70">
                Artículos del almacén organizados por categoría. Filtra por número de parte,
                condición y grupo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CreateBatchDialog />

              {shouldEnableField && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => exportPdf(exportPayload)}
                      disabled={exporting.pdf}
                      aria-label="Descargar PDF"
                      className={cn(
                        'inline-flex h-9 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 px-3 text-sm font-medium text-red-700 transition-all',
                        'hover:bg-red-500/10 hover:border-red-500/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'dark:text-red-300',
                      )}
                    >
                      {exporting.pdf ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <FaFilePdf className="size-4" />
                      )}
                      <span>PDF</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Exportar inventario filtrado a PDF <TooltipArrow />
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => exportExcel(exportPayload)}
                    disabled={exporting.xlsx}
                    aria-label="Descargar Excel"
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 text-sm font-medium text-emerald-700 transition-all',
                      'hover:bg-emerald-500/10 hover:border-emerald-500/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'dark:text-emerald-300',
                    )}
                  >
                    {exporting.xlsx ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RiFileExcel2Fill className="size-4" />
                    )}
                    <span>Excel</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Exportar inventario filtrado a Excel <TooltipArrow />
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Toolbar: search + counts */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por N° de parte (ej. 65-50587-4, TORNILLO, ALT-123…)"
                value={partNumberSearch}
                onChange={(e) => setPartNumberSearch(e.target.value)}
                className="h-10 pl-9 pr-9 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground/70"
              />
              {partNumberSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Limpiar búsqueda"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleClearSearch}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn('size-1.5 rounded-full', activeCat.dot)} />
              <span className="font-semibold uppercase tracking-widest">{activeCat.label}</span>
              <span className="text-muted-foreground/40">·</span>
              {isLoadingArticles ? (
                <Skeleton className="h-3.5 w-20" />
              ) : (
                <span>
                  <span className="font-mono font-medium text-foreground">
                    {currentData.length.toLocaleString('es-VE')}
                  </span>
                  {hasActiveSubFilter || partNumberSearch ? (
                    <>
                      <span className="text-muted-foreground/40"> / </span>
                      <span className="font-mono">{flat.length.toLocaleString('es-VE')}</span>
                    </>
                  ) : null}{' '}
                  resultado{currentData.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {/* Active filters strip */}
          <AnimatePresence>
            {(partNumberSearch || hasActiveSubFilter) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Filtros activos
                  </span>
                  {partNumberSearch && (
                    <FilterChip
                      label="N° Parte"
                      value={partNumberSearch}
                      mono
                      onClear={handleClearSearch}
                    />
                  )}
                  {activeCategory === 'COMPONENTE' && componentCondition !== 'all' && (
                    <FilterChip
                      label="Condición"
                      value={
                        COMPONENT_CONDITIONS.find((c) => c.value === componentCondition)?.label ?? ''
                      }
                      onClear={() => setComponentCondition('all')}
                    />
                  )}
                  {activeCategory === 'CONSUMIBLE' && consumableFilter !== 'all' && (
                    <FilterChip
                      label="Grupo"
                      value={
                        CONSUMABLE_FILTERS.find((c) => c.value === consumableFilter)?.label ?? ''
                      }
                      onClear={() => setConsumableFilter('all')}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category)}>
            <TabsList
              aria-label="Categorías"
              className="h-auto w-full justify-start gap-1 rounded-lg border bg-background p-1"
            >
              {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                return (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                      'data-[state=active]:bg-muted data-[state=inactive]:text-muted-foreground',
                      'data-[state=inactive]:hover:text-foreground',
                      cfg.accent,
                    )}
                  >
                    <Icon className="size-4 transition-transform group-data-[state=active]:scale-105" />
                    <span>{cfg.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={activeCategory} className="mt-5">
              {/* Sub-filters — segmented pills */}
              <AnimatePresence mode="wait">
                {activeCategory === 'COMPONENTE' && (
                  <motion.div
                    key="cond"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="mb-4"
                  >
                    <SegmentedPills
                      ariaLabel="Condición de componente"
                      value={componentCondition}
                      options={COMPONENT_CONDITIONS}
                      onChange={setComponentCondition}
                    />
                  </motion.div>
                )}

                {activeCategory === 'CONSUMIBLE' && (
                  <motion.div
                    key="cons"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="mb-4"
                  >
                    <SegmentedPills
                      ariaLabel="Filtro de consumibles"
                      value={consumableFilter}
                      options={CONSUMABLE_FILTERS}
                      onChange={setConsumableFilter}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table area */}
              <AnimatePresence mode="wait">
                {isLoadingArticles ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TableSkeleton />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`data-${activeCategory}-${componentCondition}-${consumableFilter}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <DataTable columns={cols} data={currentData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </ContentLayout>
  );
};

export default InventarioArticulosPage;

/* ────────────────────────────────────────────────────────────── */

function FilterChip({
  label,
  value,
  mono,
  onClear,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background py-1 pl-2 pr-1 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn('font-medium text-foreground', mono && 'font-mono')}>{value}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Quitar filtro ${label}`}
        className="ml-0.5 inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function SegmentedPills<T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${ariaLabel}`}
                className="absolute inset-0 rounded-md border bg-background"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
          style={{ opacity: 1 - i * 0.08 }}
        >
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
