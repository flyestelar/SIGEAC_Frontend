import axiosInstance from '@/lib/axios';
import { HardTimeTraceabilityRecord } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeTraceability = (serialNumber: string) => {
  return useQuery<HardTimeTraceabilityRecord[]>({
    queryKey: ['hard-time-traceability', serialNumber],
    queryFn: ({ signal }) =>
      axiosInstance
        .get<HardTimeTraceabilityRecord[]>('/hard-time-traceability', {
          params: { serial_number: serialNumber },
          signal,
        })
        .then((res) => ((res.data as { data?: HardTimeTraceabilityRecord[] }).data ?? res.data)),
    enabled: !!serialNumber && serialNumber.trim().length >= 2,
  });
};
