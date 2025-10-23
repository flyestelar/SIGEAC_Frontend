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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGetWarehouseArticlesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';
import { useInventoryExport } from '@/hooks/mantenimiento/almacen/reportes/useGetWarehouseReports';
import { useCompanyStore } from '@/stores/CompanyStore';
import { TooltipArrow } from '@radix-ui/react-tooltip';
import { Loader2, Package2, PaintBucket, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import { RiFileExcel2Fill } from 'react-icons/ri';
import { toast } from 'sonner';
import { flattenArticles, getColumnsByCategory, IArticleSimple } from './columns';
import { DataTable } from './data-table';

const EXPORT_PDF_ENDPOINT = '/api/inventory/export/pdf';
const EXPORT_XLSX_ENDPOINT = '/api/inventory/export/excel';

type Category = 'COMPONENTE' | 'CONSUMIBLE' | 'HERRAMIENTA';

const InventarioArticulosPage = () => {
  const { selectedCompany } = useCompanyStore();
  const [activeCategory, setActiveCategory] = useState<Category>('COMPONENTE');
  const { exporting, exportPdf, exportExcel } = useInventoryExport();
  const [componentCondition, setComponentCondition] = useState<
    | 'all'
    | 'SERVICIABLE'
    | 'REMOVIDO - NO SERVICIABLE'
    | 'REMOVIDO - CUSTODIA'
    | 'REMOVIDO - DESCARGADA'
    | 'REPARADO'
    | 'USADO'
    | 'NUEVO'
  >('all');

  const [consumableFilter, setConsumableFilter] = useState<'all' | 'QUIMICOS'>('all');
  const [partNumberSearch, setPartNumberSearch] = useState('');

  // Fetch
  const { data: articles, isLoading: isLoadingArticles } = useGetWarehouseArticlesByCategory(
    1,
    1000,
    activeCategory,
    true,
  );

  const common = {
    category: activeCategory,
    search: partNumberSearch,
    filters:
      activeCategory === 'COMPONENTE'
        ? { condition: componentCondition }
        : activeCategory === 'CONSUMIBLE'
          ? { group: consumableFilter }
          : {},
    filenamePrefix: 'inventario',
  };

  // Reset subfiltros al cambiar categoría
  useEffect(() => {
    if (activeCategory !== 'COMPONENTE') setComponentCondition('all');
    if (activeCategory !== 'CONSUMIBLE') setConsumableFilter('all');
  }, [activeCategory]);

  // Columns memo
  const cols = useMemo(() => getColumnsByCategory(activeCategory), [activeCategory]);

  // Datos + filtros memo
  const currentData = useMemo<IArticleSimple[]>(() => {
    const list = flattenArticles(articles) ?? [];

    const q = partNumberSearch.trim().toLowerCase();
    const bySearch = q
      ? list.filter(
          (a) =>
            a.part_number?.toLowerCase().includes(q) ||
            (Array.isArray(a.alternative_part_number) &&
              a.alternative_part_number.some((alt) => alt?.toLowerCase().includes(q))),
        )
      : list;

    if (activeCategory === 'COMPONENTE' && componentCondition !== 'all') {
      return bySearch.filter((a) => a.condition === componentCondition);
    }

    if (activeCategory === 'CONSUMIBLE' && consumableFilter === 'QUIMICOS') {
      return bySearch.filter((a: any) => a.is_hazardous === true);
    }

    return bySearch;
  }, [articles, partNumberSearch, activeCategory, componentCondition, consumableFilter]);

  const handleClearSearch = () => setPartNumberSearch('');

  return (
    <ContentLayout title="Inventario">
      <TooltipProvider>
        <div className="flex flex-col gap-y-4">
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

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Inventario General</h1>
            <p className="text-sm text-muted-foreground italic">
              Visualiza todos los artículos del inventario organizados por tipo
            </p>
          </div>

          {/* Búsqueda */}
          <div className="space-y-2">
            <div className="relative max-w-xl mx-auto">
              <Input
                placeholder="Búsqueda General - Nro. de Parte (Ej: 65-50587-4, TORNILLO, ALT-123...)"
                value={partNumberSearch}
                onChange={(e) => setPartNumberSearch(e.target.value)}
                className="pr-8 h-11"
              />
              {partNumberSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {partNumberSearch && (
              <p className="text-xs text-muted-foreground text-center">
                Filtrando por: <span className="font-medium text-foreground">{partNumberSearch}</span> •{' '}
                {currentData.length} resultado(s)
              </p>
            )}
          </div>

          {/* Tabs principales */}
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category)}>
            <TabsList className="flex justify-center mb-4 space-x-3" aria-label="Categorías">
              <TabsTrigger className="flex gap-2" value="COMPONENTE">
                <Package2 className="size-5" /> Componente
              </TabsTrigger>
              <TabsTrigger className="flex gap-2" value="CONSUMIBLE">
                <PaintBucket className="size-5" /> Consumibles
              </TabsTrigger>
              <TabsTrigger className="flex gap-2" value="HERRAMIENTA">
                <Wrench className="size-5" /> Herramientas
              </TabsTrigger>

              <CreateBatchDialog />

              <div className="flex gap-4 items-center">
                {/* PDF */}
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => exportPdf(common)}
                      disabled={exporting.pdf}
                      className="disabled:opacity-50"
                      aria-label="Descargar PDF"
                    >
                      {exporting.pdf ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <FaFilePdf className="size-5 text-red-500/80 hover:scale-125 transition-transform" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Descargar PDF <TooltipArrow />
                  </TooltipContent>
                </Tooltip>

                {/* Excel */}
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => exportExcel(common)}
                      disabled={exporting.xlsx}
                      className="disabled:opacity-50"
                      aria-label="Descargar Excel"
                    >
                      {exporting.xlsx ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <RiFileExcel2Fill className="size-6 text-green-600/80 hover:scale-125 transition-transform" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Descargar Excel <TooltipArrow />
                  </TooltipContent>
                </Tooltip>
              </div>
            </TabsList>

            {/* Sub-tabs por categoría */}
            <TabsContent value={activeCategory} className="mt-6">
              {activeCategory === 'COMPONENTE' && (
                <Tabs
                  value={componentCondition}
                  onValueChange={(v) => setComponentCondition(v as typeof componentCondition)}
                  className="mb-4"
                >
                  <TabsList className="flex justify-center mb-4 space-x-3" aria-label="Condición de componente">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="SERVICIABLE">Serviciables</TabsTrigger>
                    <TabsTrigger value="REPARADO">Reparados</TabsTrigger>
                    <TabsTrigger value="REMOVIDO - NO SERVICIABLE">Removidos - No Serviciables</TabsTrigger>
                    <TabsTrigger value="REMOVIDO - CUSTODIA">Removidos - En custodia</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {activeCategory === 'CONSUMIBLE' && (
                <Tabs
                  value={consumableFilter}
                  onValueChange={(v) => setConsumableFilter(v as typeof consumableFilter)}
                  className="mb-4"
                >
                  <TabsList className="flex justify-center mb-4 space-x-3" aria-label="Filtro de consumibles">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="QUIMICOS">Químicos</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {isLoadingArticles ? (
                <div className="flex w-full h-full justify-center items-center min-h-[300px]">
                  <Loader2 className="size-24 animate-spin" />
                </div>
              ) : (
                <DataTable columns={cols} data={currentData} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </ContentLayout>
  );
};

export default InventarioArticulosPage;
