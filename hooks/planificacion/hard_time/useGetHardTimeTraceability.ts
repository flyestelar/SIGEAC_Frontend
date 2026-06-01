import { hardTimeTraceabilityIndexOptions } from '@api/queries';
import { useQuery } from '@tanstack/react-query';

export const useGetHardTimeTraceability = (serialNumber: string) => {
  return useQuery({
    ...hardTimeTraceabilityIndexOptions({ query: { serial_number: serialNumber } }),
    enabled: !!serialNumber && serialNumber.trim().length >= 2,
  });
};
