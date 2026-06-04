'use client';

import { useCompanyStore } from '@/stores/CompanyStore';
import { dispatchOrderShowItemsDispatchPaginatedOptions } from '@api/queries';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

interface UsePaginatedWarehouseArticlesParams {
  search?: string;
  page?: number;
  perPage?: number;
}

export function usePaginatedWarehouseArticles({
  search,
  page = 1,
  perPage = 25,
}: UsePaginatedWarehouseArticlesParams = {}) {
  const { selectedStation } = useCompanyStore();

  return useQuery({
    ...dispatchOrderShowItemsDispatchPaginatedOptions({
      query: {
        location: Number(selectedStation),
        category: 'COMPONENTE',
        search: search || undefined,
        page,
        per_page: perPage,
      },
    }),
    enabled: !!selectedStation,
    placeholderData: keepPreviousData,
  });
}
