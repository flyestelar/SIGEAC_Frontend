import axios from '@/lib/axios';
import { Batch } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchBatches = async ({company, location_id}: {company?: string, location_id?: string}): Promise<Batch[]> => {
  const {data} = await axios.get(`/${company}/${location_id}/batches`);
  return data;
};

export const useGetBatches = ({company, location_id}: {company?: string, location_id?: string}) => {
  return useQuery<Batch[], Error>({
    queryKey: ["batches", company, location_id],
    queryFn: () => fetchBatches({company, location_id}),
    enabled: !!location_id && !!company
  });
};
