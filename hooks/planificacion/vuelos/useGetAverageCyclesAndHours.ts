'use client';

import axiosInstance from '@/lib/axios';
import { aircraftAverageByDateRangeOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

interface DateRange {
  first_date: string;
  second_date: string;
}

export const useGetAverageCyclesAndHours = (acronym: string, dateRange?: DateRange | null) => {
  return useQuery({
    ...aircraftAverageByDateRangeOptions({
      path: { acronym },
      query: { from: dateRange?.first_date, to: dateRange?.second_date },
    }),
    refetchOnWindowFocus: false,
    enabled: !!acronym,
  });
};
