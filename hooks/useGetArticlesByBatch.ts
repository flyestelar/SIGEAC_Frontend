
import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Article } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { se } from 'date-fns/locale';
const fetchArticlesByBatch = async (location_id: number | string, batch: string, company?: string): Promise<Article[]> => {
  const { data } = await axiosInstance.post(`/${company}/batches/${batch}`, { location_id });
  return data;
};

export const useGetArticlesByBatch = (location_id: number, batch: string) => {
  const { selectedCompany } = useCompanyStore();
  return useMutation<Article[], Error, number>({
    mutationKey: ["articles-by-batch", location_id, batch, selectedCompany?.slug],
    mutationFn: () => fetchArticlesByBatch(location_id, batch, selectedCompany?.slug),
  });
};
