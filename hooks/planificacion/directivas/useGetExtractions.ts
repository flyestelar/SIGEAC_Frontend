import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { useQuery } from '@tanstack/react-query';

export type ExtractionRow = {
  id: number;
  source_ref: string | null;
  effective_date: string | null; // 'YYYY-MM-DD'
  parser: string; // 'FAA_AD_V1'
  status: 'PENDING' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  groups_count: number; // puedes calcularlo server-side
  confidence?: { global?: number } | null;
  created_at: string; // opcional, para ordenar por fecha de carga
};

const fetchExtractions = async (company: string | undefined): Promise<ExtractionRow[]> => {
  const { data } = await axiosInstance.get(`/${company}/extractions`);
  return data;
};

export const useGetExtractions = () => {
  const { selectedCompany } = useCompanyStore();
  return useQuery<ExtractionRow[], Error>({
    queryKey: ['flight-control'],
    queryFn: () => fetchExtractions(selectedCompany?.slug),
    enabled: !!selectedCompany,
  });
};
