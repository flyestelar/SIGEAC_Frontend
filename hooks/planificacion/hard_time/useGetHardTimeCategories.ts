import axiosInstance from '@/lib/axios';
import { HardTimeCategory } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeCategories = () => {
  return useQuery<HardTimeCategory[]>({
    queryKey: ['hard-time-categories'],
    queryFn: ({ signal }) =>
      axiosInstance
        .get<HardTimeCategory[]>('/hard-time-categories', { signal })
        .then((res) => ((res.data as { data?: HardTimeCategory[] }).data ?? res.data)),
  });
};
