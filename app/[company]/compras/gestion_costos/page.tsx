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
import { useGetWarehouseArticlesByCategory } from '@/hooks/mantenimiento/almacen/renglones/useGetArticlesByCategory';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Package, Save } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { BatchCard } from './_components/BatchCard';
import { EmptyState } from './_components/EmptyState';
import { FilterPanel } from './_components/FilterPanel';
import { PaginationControls } from './_components/PaginationControls';
import { useArticleChanges } from './_components/hooks/useArticleChanges';
import { useGlobalSearch } from './_components/hooks/useGlobalSearch';
import { useBackendPagination } from './_components/hooks/usePagination';
const GestionCantidadesPage = () => {
  const { selectedCompany } = useCompanyStore();

  // Hook de paginación del backend
  const { currentPage, itemsPerPage, createPaginationInfo, createPaginationActions, scrollTargetRef } =
    useBackendPagination({ initialPage: 1, initialPerPage: 25 });

  // Obtener todos los batches con artículos enviando page y per_page al backend
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useGetWarehouseArticlesByCategory(currentPage, itemsPerPage, 'CONSUMIBLE');

  // Obtener todas las zonas del almacén para los selects

  // Extraer batches y paginationInfo de la respuesta
  // Memoize para evitar crear nuevas referencias en cada render
  const batches = useMemo(() => response?.batches || [], [response?.batches]);
  const paginationInfo = createPaginationInfo(response?.pagination);
  const paginationActions = createPaginationActions(paginationInfo.totalPages);

  // Hook para búsqueda global y filtros
  const { state: filterState, actions: filterActions, stats: filterStats } = useGlobalSearch(batches);

  // Hook para manejar cambios en artículos usando batches filtrados
  const {
    state: { costs, hasChanges },
    actions: { handleCostChange },
    utils: { getModifiedArticles, modifiedCount },
  } = useArticleChanges(filterStats.filteredBatches);

  const { updateArticleCost } = useUpdateArticleCost();

  const handleSave = useCallback(() => {
    const modifiedEntries = getModifiedArticles();

    if (modifiedEntries.length === 0) {
      toast.info('No hay cambios para guardar');
      return;
    }

    const requestPayload = {
      updates: modifiedEntries.map((entry) => ({
        article_id: entry.articleId,
        ...(entry.costChanged && { new_cost: entry.newCost }),
      })),
      company: selectedCompany!.slug,
    };

    updateArticleCost.mutate(requestPayload);
  }, [getModifiedArticles, selectedCompany, updateArticleCost]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <ContentLayout title="Gestión de Cantidades y Ubicaciones">
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
              <BreadcrumbPage>Gestión de Cantidades</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Scroll target para paginación */}
        <div ref={scrollTargetRef} className="scroll-mt-4" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              Gestión de Cantidades y Ubicaciones
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Actualiza las cantidades de consumibles y las ubicaciones de componentes en el almacén
            </p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Guardar Cambios
            {hasChanges && modifiedCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{modifiedCount}</span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        <FilterPanel batches={batches} filterState={filterState} filterActions={filterActions} stats={filterStats} />

        {/* Performance Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filterStats.isSearching ? (
              <span className="text-blue-600">🔍 Buscando en toda la base de datos...</span>
            ) : filterState.partNumberFilter ? (
              <span>
                ✅ Resultados de búsqueda global
                {filterStats.hasActiveFilters && (
                  <span className="ml-2 text-blue-600">
                    • {filterStats.articleCounts.filteredArticles} artículos encontrados
                  </span>
                )}
              </span>
            ) : (
              <span>
                Mostrando {paginationInfo.from} - {paginationInfo.to} de {paginationInfo.totalItems} batches • Página{' '}
                {paginationInfo.currentPage} de {paginationInfo.totalPages}• {paginationInfo.itemsPerPage} por página
                {filterStats.hasActiveFilters && (
                  <span className="ml-2 text-blue-600">
                    • {filterStats.articleCounts.filteredArticles} artículos filtrados
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        {/* Articles by Batch - Datos filtrados */}
        {filterStats.filteredBatches &&
          Array.isArray(filterStats.filteredBatches) &&
          filterStats.filteredBatches.map((batch) => (
            <BatchCard key={batch.batch_id} batch={batch} onCostChange={handleCostChange} />
          ))}

        {/* Pagination Controls - Ocultar durante búsqueda global */}
        {!filterState.partNumberFilter && (
          <PaginationControls paginationInfo={paginationInfo} paginationActions={paginationActions} />
        )}

        {/* Empty State */}
        {(!filterStats.filteredBatches ||
          !Array.isArray(filterStats.filteredBatches) ||
          filterStats.filteredBatches.length === 0) &&
          !isLoading &&
          !filterStats.isSearching && (
            <EmptyState hasActiveFilters={filterStats.hasActiveFilters} onClearFilters={filterActions.clearFilters} />
          )}
      </div>
    </ContentLayout>
  );
};

export default GestionCantidadesPage;
