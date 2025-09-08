import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch } from '@/types';
import { useQuery } from '@tanstack/react-query';

type FetchArgs = {
  company?: string;
  location_id?: string;
  condition_id?: string; // opcional para poder deshabilitar cuando sea "all"
};

const fetchBatches = async ({ company, location_id, condition_id }: FetchArgs): Promise<Batch[]> => {
  if (!company || !location_id) return [];
  const url = `/${company}/${location_id}/show-by-article-condition/${condition_id}`;
  const { data } = await axiosInstance.get<Batch[]>(url);
  return Array.isArray(data) ? data : [];
};

export const useGetBatchesByArticleCondition = (condition_id?: string) => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  const company = selectedCompany?.slug;
  const location_id = selectedStation ?? undefined;

  const hasBasics = !!company && !!location_id && !!condition_id;

  return useQuery<Batch[], Error>({
    queryKey: ['batches-by-article-condition', company, location_id, condition_id],
    queryFn: () =>
      fetchBatches({ company, location_id, condition_id: condition_id ? condition_id : undefined }),
    enabled: hasBasics,                       // habilita siempre que haya empresa/estación
    staleTime: 30_000,                        // cachea 30s
    placeholderData: [],                      // evita undefined
    retry: 1,
  });
};
