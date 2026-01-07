'use client';

import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ThirdParty } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchThirdParties = async (company: string | undefined): Promise<ThirdParty[]> => {
  const { data } = await axiosInstance.get(`/${company}/third-parties`);
  return data;
};

export const useGetThirdParties = () => {
  const { selectedCompany } = useCompanyStore();
  return useQuery<ThirdParty[]>({
    queryKey: ['third-parties', selectedCompany?.slug],
    queryFn: () => fetchThirdParties(selectedCompany?.slug),
    staleTime: 1000 * 60 * 2, // 5 minutos
    enabled: !!selectedCompany,
  });
};
