import { hardTimeCategoryIndex } from '@api/sdk.gen';
import { HardTimeCategoryResource } from '@api/types';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeCategories = () => {
  return useQuery<HardTimeCategoryResource[]>({
    queryKey: ['hard-time-categories'],
    queryFn: async () =>
      hardTimeCategoryIndex({
        throwOnError: true,
      }).then((res) => res.data.data),
  });
};
