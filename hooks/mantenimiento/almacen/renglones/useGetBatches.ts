import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Batch } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchBatches = async ({ company, location_id }: { company?: string, location_id?: string }): Promise<Batch[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/batches`);
  return data;
};

export const useGetBatches = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<Batch[], Error>({
    queryKey: ["batches", selectedCompany, selectedStation],
    queryFn: () => fetchBatches({ company: selectedCompany?.slug, location_id: selectedStation ?? undefined }),
    enabled: !!selectedStation && !!selectedCompany
  });
};
