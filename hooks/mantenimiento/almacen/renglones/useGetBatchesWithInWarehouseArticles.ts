import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Component, Consumable, Tool } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface BatchesWithArticles extends Batch {
  articles: {
    serial: string;
    part_number: string;
    id: number;
    quantity?: number;
    alternative_part_number?: string[];
  }[];
  batch_id: number;
}

const fetchBatchesWithInWarehouseArticles = async ({
  location_id,
  company,
  category,
}: {
  location_id: number;
  company: string;
  category: string;
}): Promise<BatchesWithArticles[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/items-for-dispatch`, {
    params: { category },
  });
  return data;
};

export const useGetBatchesWithInWarehouseArticles = (category: string) => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<BatchesWithArticles[], Error>({
    queryKey: ['batches-in-warehouse', selectedCompany, selectedStation],
    queryFn: () =>
      fetchBatchesWithInWarehouseArticles({
        company: selectedCompany?.slug ?? '',
        location_id: Number(selectedStation),
        category,
      }),
    enabled: !!selectedStation && !!selectedCompany && !!category,
  });
};
