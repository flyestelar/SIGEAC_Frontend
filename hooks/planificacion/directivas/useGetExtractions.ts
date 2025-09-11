import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { useQuery } from '@tanstack/react-query';

export type ExtractionRow = {
  id: number;
  source_ref: string | null;
  effective_date: string | null; // 'YYYY-MM-DD'
  parser: string; // 'FAA_AD_V1'
  payload: {
    text: string,
    source_ref: string,
    effective_date: string,
    ata: string,
    applicability: {
      aircraft: {
        manufacturer: string;
        model: string,
        series: string[];
      };
    }
    groups: {
      label: string;
      body: string;
      drivers: { type: 'thresh' | 'repeat'; unit: 'HRS' | 'CYC' | 'DAYS'; value: number }[];
    }[],
  }
  status: 'PENDING' | 'REVIEW'  | 'APPROVED' | 'REJECTED';
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
