import axios from "@/lib/axios";
import { Convertion } from "@/types";
import { useQuery } from "@tanstack/react-query";

const fetchSecondaryUnits = async (company?: string): Promise<Convertion[]> => {
  const { data } = await axios.get(`/${company}/convertion`);
  return data;
};

export const useGetSecondaryUnits = (company?: string) => {
  return useQuery<Convertion[]>({
    queryKey: ["secondary-units"],
    queryFn: () => fetchSecondaryUnits(company),
    enabled: !!company,
  });
};
