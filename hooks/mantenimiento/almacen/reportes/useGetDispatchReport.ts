import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Aircraft } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { formatISO } from 'date-fns';

export interface DispatchReport {
  id: number;
  request_number: string;
  status: string;
  requested_by: string;
  approved_by: string;
  delivered_by: string;
  created_by: string;
  justification: string;
  submission_date: string;
  work_order?: string | null;
  work_shop?: {
    id: number;
    name: string;
    location_id: string;
  } | null;
  aircraft?: Aircraft | null;
  articles: {
    id: number;
    part_number: string;
    alternative_part_number?: string[];
    serial?: string;
    description: string;
    quantity: number;
  }[];
}

const normalizeDate = (d?: Date | string | null): string | null => {
  if (!d) return null;
  if (typeof d === 'string') return d;
  return formatISO(d, { representation: 'date' });
};

interface DispatchFilters {
  aircraft_id?: number | null;
  workshop_id?: string | null;
  from?: Date | string | null;
  to?: Date | string | null;
}

const fetchDispatchReport = async (
  location_id: string,
  company: string,
  filters: DispatchFilters,
): Promise<DispatchReport[]> => {
  const body = {
    aircraft_id: filters.aircraft_id ?? null,
    workshop_id: filters.workshop_id ?? null,
    from: normalizeDate(filters.from),
    to: normalizeDate(filters.to),
  };

  const { data } = await axios.post(`/${company}/${location_id}/report-dispatch-orders`, body);
  return data;
};

export const useGetDispatchReport = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();

  return useMutation<DispatchReport[], Error, DispatchFilters>({
    mutationKey: ['dispatch-report', selectedCompany?.slug, selectedStation],
    mutationFn: (filters: DispatchFilters) => {
      if (!selectedCompany?.slug || !selectedStation) {
        throw new Error('Station or Company not defined');
      }

      return fetchDispatchReport(selectedStation, selectedCompany.slug, filters);
    },
  });
};
