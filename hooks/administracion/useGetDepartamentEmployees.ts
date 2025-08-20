import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Employee } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';

const fetchDepartamentEmployees = async (location_id: string | null, company?: string): Promise<Employee[]> => {
  const { data } = await axios.get(`/${company}/${location_id}/employees-department`);
  return data;
};

export const useGetDepartamentEmployees = () => {
  const { selectedCompany, selectedStation } = useCompanyStore(); 
  return useQuery<Employee[], Error, number>({
    queryKey: ['departament-employees'],
    queryFn: () => fetchDepartamentEmployees(selectedStation, selectedCompany?.slug),
    enabled: !!selectedStation && !!selectedCompany,
  });
};
