import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { FlightControl, TaskMaster } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchTaskMasters = async (company: string | undefined): Promise<TaskMaster[]> => {
  const { data } = await axios.get(`/${company}/tasks`);
  return data;
};

export const useGetTaskMasters = () => {
  const { selectedCompany } = useCompanyStore();
  return useQuery<TaskMaster[], Error>({
    queryKey: ['flight-control'],
    queryFn: () => fetchTaskMasters(selectedCompany?.slug),
    enabled: !!selectedCompany,
  });
};
