import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch, Component, Consumable, Tool } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';

interface BatchesWithArticles extends Batch {
  articles: Tool[] | Component[] | Consumable[];
  batch_id: number;
}

const fetchBatchesWithInWarehouseArticles = async ({
  location_id,
  company,
}: {
  location_id: number;
  company: string;
}): Promise<BatchesWithArticles[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/items-for-dispatch`);
  return data;
};

export const useGetBatchesWithInWarehouseArticles = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<
    BatchesWithArticles[],
    Error
  >({
    queryKey: ['batches-in-warehouse', selectedCompany, selectedStation],
    queryFn: () => fetchBatchesWithInWarehouseArticles({
      company: selectedCompany?.slug ?? '', location_id: Number(selectedStation)
    }),
  });
};
