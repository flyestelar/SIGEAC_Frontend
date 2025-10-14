import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface BatchesWithCountProp extends Batch {
  article_count: number;
}

const searchBatchesByPartNumber = async (
  part_number: string | undefined,
  location_id: string | null,
  company?: string,
): Promise<BatchesWithCountProp[]> => {
  const { data } = await axiosInstance.get(`/${company}/search-by-part`, {
    params: { location_id, part_number },
  });
  return data;
};

export const useSearchBatchesByPartNumber = (part_number?: string) => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<BatchesWithCountProp[], Error>({
    queryKey: ['search-batches', selectedCompany?.slug, selectedStation, part_number],
    queryFn: () => searchBatchesByPartNumber(part_number, selectedStation, selectedCompany?.slug),
    enabled: !!selectedCompany && !!selectedStation && !!part_number,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
};
