import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { Company, Workshop } from '@/types';
import { useQuery } from '@tanstack/react-query';

const fetchWorkshops = async (company?: string, location_id?: string): Promise<Workshop[]> => {
    const { data } = await axiosInstance.get(`/${company}/${location_id}/workshops`);
    return data;
};

export const useGetWorkshopsByLocation = () => {
    const { selectedCompany, selectedStation } = useCompanyStore()
    return useQuery<Workshop[]>({
        queryKey: ['workshops', selectedCompany, selectedStation],
        queryFn: () => fetchWorkshops(selectedCompany?.slug, selectedStation ?? undefined),
        staleTime: 1000 * 60 * 5, // 5 minutos
        enabled: !!selectedCompany && !!selectedStation,
    });
};
