import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { WorkOrder } from '@/types';
import { useQuery } from '@tanstack/react-query';

export interface DispachedArticles {
  id: number;
  batch_name: string;
  serial: string;
  justification: string;
  category: string;
  date: string;
  work_order: WorkOrder;
  articles: {
    part_number: string;
    id: number;
    serial: string;
    description: string;
    quantity: number,
  }[];
}

const fetchDispatchedArticles = async ({
  company,
  location_id,
}: {
  location_id: string | null;
  company?: string;
}): Promise<DispachedArticles[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/dispatched-articles`);
  return data;
};

export const useGetDispatchedArticles = () => {
  const { selectedCompany, selectedStation } = useCompanyStore()
  return useQuery({
    queryKey: ['dispatched-articles'],
    queryFn: () =>
      fetchDispatchedArticles({ company: selectedCompany?.slug, location_id: selectedStation }),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!selectedCompany && !!selectedStation,
  });
};
