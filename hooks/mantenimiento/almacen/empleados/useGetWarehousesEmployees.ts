import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Employee } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';

const fetchWarehousesEmployees = async (
  location_id: string | null,
  company?: string
): Promise<Employee[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/employee-warehouse`);
  return data;
};

export const useGetWarehousesEmployees = () => {
  const { selectedCompany, selectedStation } = useCompanyStore();
  return useQuery<Employee[], Error>(
    {
      queryKey: ['warehouses-employees'],
      queryFn: () => fetchWarehousesEmployees(selectedStation, selectedCompany?.slug),
      enabled: !!selectedCompany && !!selectedStation,
    }
  );
};
