import axiosInstance from '@/lib/axios';
import { WarehouseDashboard } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchWarehouseDashboard = async (company: string, location_id: string) => {
  const { data } = await axiosInstance.get(`/${company}/${location_id}/warehouse/dashboard`);
  return data;
};

export const useGetWarehouseDashboard = (company: string, location_id: string) => {
  return useQuery<WarehouseDashboard>({
    queryKey: ['warehouse-dashboard', company, location_id],
    queryFn: () => fetchWarehouseDashboard(company!, location_id!),
    enabled: !!company && location_id !== undefined,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000,
  });
};
