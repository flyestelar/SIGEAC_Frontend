import { useCompanyStore } from '@/stores/CompanyStore';
import { batchesShowByCategory } from '@api/sdk';
import { useQuery } from '@tanstack/react-query';

export const useGetBatchesByCategory = (category: string) => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery({
    queryKey: ['search-batches', selectedCompany, selectedStation, category],
    queryFn: ({ signal }) =>
      batchesShowByCategory({
        path: {
          category,
          company: selectedCompany?.slug || '',
          location: selectedStation?.toString() || '',
        },
        signal,
        throwOnError: true,
      }).then((response) => response.data),
    enabled: !!selectedCompany && !!category && !!selectedStation,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
};
