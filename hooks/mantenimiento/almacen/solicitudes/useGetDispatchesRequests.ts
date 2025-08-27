import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { WorkOrder } from '@/types';
import { useQuery } from '@tanstack/react-query';

interface IDispatch {
  id: number;
  requested_by: string;
  created_by: string;
  justification: string;
  destination_place: string;
  submission_date: string;
  status: 'PROCESO' | 'APROBADO' | 'RECHAZADO';
  work_order?: WorkOrder;
  articles: {
    id: number;
    part_number: string;
    serial: string;
    description: string;
    quantity: string;
  }[];
}

const fetchDispatchesRequests = async ({
  location_id,
  company,
}: {
  location_id: number;
  company?: string;
}): Promise<IDispatch[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/dispatch-orders`);
  return data;
};

export const useGetDispatchesByLocation = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<IDispatch[], Error>({
    queryKey: ['dispatch-orders', selectedCompany, selectedStation],
    queryFn: () => fetchDispatchesRequests({ company: selectedCompany?.slug, location_id: Number(selectedStation) }),
    enabled: !!selectedStation && !!selectedCompany,
  });
};
