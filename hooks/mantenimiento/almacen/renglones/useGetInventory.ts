import { useSearchBatchesByPartNumber } from '@/hooks/mantenimiento/almacen/renglones/useGetBatchesByArticlePartNumber';
import { useMemo } from 'react';
import { useGetBatches } from './useGetBatches';

/**
 * Hook centralizado para obtener y manejar batches con búsqueda opcional.
 * Sirve para Inventario General y Gestión de Inventario.
 */
export const useInventory = (stationId: string | null, companySlug?: string, searchTerm?: string) => {
  // 🔹 Fetch de todos los batches
  const {
    data: allBatches,
    isLoading: isLoadingBatches,
    isError: isBatchesError,
    error: batchesError,
  } = useGetBatches();

  // 🔹 Fetch de batches buscados por part number
  const {
    data: searchedBatches,
    isLoading: isLoadingSearch,
    isError: isSearchError,
    error: searchError,
  } = useSearchBatchesByPartNumber(searchTerm || undefined);

  // 🔹 Calcular qué batches mostrar
  const displayedBatches = useMemo(() => {
    if (!allBatches) return [];

    if (!searchTerm?.trim()) {
      return allBatches;
    }

    if (searchedBatches?.length) {
      const searchedIds = new Set(searchedBatches.map((b) => b.id));
      return allBatches.filter((batch) => searchedIds.has(batch.id));
    }

    return [];
  }, [allBatches, searchedBatches, searchTerm]);

  // 🔹 Estados derivados
  const isLoading = isLoadingBatches || (!!searchTerm && isLoadingSearch);
  const isEmptyState = !isLoading && displayedBatches.length === 0;
  const showNoResults = !isLoading && !!searchTerm && isEmptyState;

  return {
    displayedBatches,
    isLoading,
    isBatchesError,
    batchesError,
    isSearchError,
    searchError,
    showNoResults,
  };
};
