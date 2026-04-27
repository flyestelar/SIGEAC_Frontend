import { hardTimeIntervalCompliancesInfiniteOptions } from '@api/queries';
import { useInfiniteQuery } from '@tanstack/react-query';

type Filters = {
  start_date?: string;
  end_date?: string;
  per_page?: number;
};

export const useGetHardTimeIntervalCompliances = (
  intervalId: number | null | undefined,
  filters?: Filters,
) => {
  return useInfiniteQuery({
    ...hardTimeIntervalCompliancesInfiniteOptions({
      path: { id: intervalId! },
      query: {
        per_page: filters?.per_page ?? 10,
        start_date: filters?.start_date,
        end_date: filters?.end_date,
      },
    }),
    enabled: !!intervalId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
    },
  });
};

