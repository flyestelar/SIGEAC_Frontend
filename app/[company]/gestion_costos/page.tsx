'use client';

import { useUpdateArticleCost } from '@/actions/mantenimiento/compras/gestion_compras/actions';
import { ContentLayout } from '@/components/layout/ContentLayout';
import LoadingPage from '@/components/misc/LoadingPage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetWarehouseArticlesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Package, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BatchCard } from './_components/BatchCard';
import { EmptyState } from './_components/EmptyState';
import { FilterPanel } from './_components/FilterPanel';
import { PaginationControls } from './_components/PaginationControls';
import { useArticleChanges } from './_components/hooks/useArticleChanges';
import { useGlobalSearch } from './_components/hooks/useGlobalSearch';
import { useBackendPagination } from './_components/hooks/usePagination';

type ArticleType = 'CONSUMIBLE' | 'COMPONENTE' | 'HERRAMIENTA';
const CATEGORY_LABEL: Record<ArticleType, string> = {
  CONSUMIBLE: 'Consumibles',
  COMPONENTE: 'Componentes',
  HERRAMIENTA: 'Herramientas',
};

const GestionCantidadesPage = () => {
  const { selectedCompany } = useCompanyStore();

  // Tabs
  const [articleType, setArticleType] = useState<ArticleType>('COMPONENTE');

  // Paginación backend
  const { currentPage, itemsPerPage, createPaginationInfo, createPaginationActions, scrollTargetRef } =
    useBackendPagination({ initialPage: 1, initialPerPage: 25 });

  // Reset al cambiar de pestaña
  useEffect(() => {
    scrollTargetRef.current?.scrollTo(0, 0);
  }, [articleType, scrollTargetRef]);

  // Datos (nota: pasamos articleType)
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useGetWarehouseArticlesByCategory(currentPage, itemsPerPage, articleType);

  const batches = useMemo(() => response?.batches || [], [response?.batches]);
  const paginationInfo = createPaginationInfo(response?.pagination);
  const paginationActions = createPaginationActions(paginationInfo.totalPages);

  // Búsqueda y filtros
  const { state: filterState, actions: filterActions, stats: filterStats } = useGlobalSearch(batches);

  // Cambios de artículos
  const {
    state: { hasChanges },
    actions: { handleCostChange, resetChanges },
    utils: { getModifiedArticles, modifiedCount },
  } = useArticleChanges(filterStats.filteredBatches);

  // Limpia cambios al cambiar de tipo
  useEffect(() => {
    resetChanges();
  }, [articleType, resetChanges]);

  // Mutación
  const { updateArticleCost } = useUpdateArticleCost();

  // Helpers
  const buildPayload = useCallback(() => {
    const updates = getModifiedArticles()
      .map(({ articleId, cost }) => ({ id: Number(articleId), cost: Number(cost) }))
      .filter(({ id, cost }) => Number.isFinite(id) && Number.isFinite(cost) && cost >= 0);

    // incluye tipo para que el backend pueda validar/rutear si aplica
    return { company: selectedCompany?.slug ?? '', type: articleType, updates };
  }, [getModifiedArticles, selectedCompany?.slug, articleType]);

  const handleSave = useCallback(async () => {
    if (!selectedCompany?.slug) {
      toast.error('Falta la compañía seleccionada.');
      return;
    }

    const payload = buildPayload();
    if (!payload.updates.length) {
      toast.info('No hay cambios para guardar.');
      return;
    }

    try {
      await updateArticleCost.mutateAsync(payload);
      toast.success(`Se han guardado los cambios en ${payload.updates.length} artículo(s).`);
      resetChanges();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      toast.error(`No se pudo guardar: ${message}`);
    }
  }, [buildPayload, updateArticleCost, resetChanges, selectedCompany?.slug]);

  if (isLoading) return <LoadingPage />;

  if (isError) {
    return (
      <ContentLayout title="Gestión de Costos">
        <div className="p-4 rounded-lg border bg-red-50 text-red-700">Error al cargar inventario: {String(error)}</div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Gestión de Costos">
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${selectedCompany?.slug}/dashboard`}>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Almacén</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Inventario</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Gestión de Costos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              Gestión de Costos
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {CATEGORY_LABEL[articleType]} • Actualiza costos de forma segura y trazable.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateArticleCost.isPending || modifiedCount === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateArticleCost.isPending ? 'Guardando…' : 'Guardar Cambios'}
            {hasChanges && modifiedCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{modifiedCount}</span>
            )}
          </Button>
        </div>

        {/* Tabs de tipo de artículo */}
        <Tabs value={articleType} onValueChange={(v) => setArticleType(v as ArticleType)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="CONSUMIBLE">Consumibles</TabsTrigger>
            <TabsTrigger value="COMPONENTE">Componentes</TabsTrigger>
            <TabsTrigger value="HERRAMIENTA">Herramientas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Scroll anchor */}
        <div ref={scrollTargetRef} className="scroll-mt-4" />

        {/* Panel de filtros */}
        <FilterPanel batches={batches} filterState={filterState} filterActions={filterActions} stats={filterStats} />

        {/* Estado de consulta */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filterStats.isSearching ? (
              <span className="text-blue-600">🔍 Búsqueda global en progreso…</span>
            ) : filterState.partNumberFilter ? (
              <span>
                ✅ Resultados de búsqueda global
                {filterStats.hasActiveFilters && (
                  <span className="ml-2 text-blue-600">• {filterStats.articleCounts.filteredArticles} artículos</span>
                )}
              </span>
            ) : (
              <span>
                Mostrando {paginationInfo.from}–{paginationInfo.to} de {paginationInfo.totalItems} • Página{' '}
                {paginationInfo.currentPage} de {paginationInfo.totalPages} • {paginationInfo.itemsPerPage} por página
                {filterStats.hasActiveFilters && (
                  <span className="ml-2 text-blue-600">
                    • {filterStats.articleCounts.filteredArticles} artículos filtrados
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        {/* Listado filtrado */}
        {Array.isArray(filterStats.filteredBatches) &&
          filterStats.filteredBatches.map((batch) => (
            <BatchCard key={`${articleType}-${batch.batch_id}`} batch={batch} onCostChange={handleCostChange} />
          ))}

        {/* Paginación */}
        {!filterState.partNumberFilter && (
          <PaginationControls paginationInfo={paginationInfo} paginationActions={paginationActions} />
        )}

        {/* Vacío */}
        {(!Array.isArray(filterStats.filteredBatches) || filterStats.filteredBatches.length === 0) &&
          !isLoading &&
          !filterStats.isSearching && (
            <EmptyState hasActiveFilters={filterStats.hasActiveFilters} onClearFilters={filterActions.clearFilters} />
          )}
      </div>
    </ContentLayout>
  );
};

export default GestionCantidadesPage;
