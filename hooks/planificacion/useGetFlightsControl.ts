import axios from '@/lib/axios';
import { FlightControl } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchFlightControl = async (company: string): Promise<FlightControl[]> => {
  const { data } = await axios.get(`/${company}/flight-control`);
  return data;
};

export const useGetFlightControl = (company: string | undefined) => {
  return useQuery<FlightControl[], Error>({
    queryKey: ['flight-control', company],
    queryFn: () => fetchFlightControl(company!),
    enabled: !!company,
  });
};
