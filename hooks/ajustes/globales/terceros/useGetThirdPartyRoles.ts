'use client';

import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { ThirPartyRole } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchThirdPartyRoles = async (company: string | undefined): Promise<ThirPartyRole[]> => {
  const { data } = await axiosInstance.get(`/${company}/third-party-roles`);
  return data;
};

export const useGetThirdPartyRoles = () => {
  const { selectedCompany } = useCompanyStore();
  return useQuery<ThirPartyRole[]>({
    queryKey: ['third-party-roles', selectedCompany?.slug],
    queryFn: () => fetchThirdPartyRoles(selectedCompany?.slug),
    staleTime: 1000 * 60 * 2, // 5 minutos
    enabled: !!selectedCompany,
  });
};
