import { useQuery } from '@tanstack/react-query';
import { hardTimeInstallationRequestIndexOptions } from '@api/queries';

export const useGetInstallRequests = (status?: 'pending' | 'approved' | 'rejected') => {
  return useQuery({
    ...hardTimeInstallationRequestIndexOptions({ query: { status } }),
    select: (data) => data.data,
  });
};
