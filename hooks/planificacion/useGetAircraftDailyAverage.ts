import { aircraftAverageByDateRangeOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

interface DailyAverageDateRange {
  from?: string | null;
  to?: string | null;
}

export const useGetAircraftDailyAverage = (
  acronym?: string,
  dateRange?: DailyAverageDateRange,
  enabled = true,
) => {
  return useQuery({
    ...aircraftAverageByDateRangeOptions({
      path: { acronym: acronym ?? '' },
      query: {
        from: dateRange?.from ?? null,
        to: dateRange?.to ?? null,
      },
    }),
    enabled: enabled && !!acronym,
    refetchOnWindowFocus: false,
  });
};

export const useGetAircraftAverage = useGetAircraftDailyAverage;
