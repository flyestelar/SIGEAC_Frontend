import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Workshop } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchWorkshops = async (company?: string): Promise<Workshop[]> => {
    const { data } = await axiosInstance.get(`/${company}/workshops`);
    return data;
};

export const useGetWorkshops = () => {
    const { selectedCompany } = useCompanyStore()
    return useQuery<Workshop[]>({
        queryKey: ['workshops', selectedCompany?.slug],
        queryFn: () => fetchWorkshops(selectedCompany?.slug),
        staleTime: 1000 * 60 * 5, // 5 minutos
        enabled: !!selectedCompany,
    });
};
