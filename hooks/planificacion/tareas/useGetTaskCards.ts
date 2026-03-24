import axios from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { PaginatedResponse } from '@/types';
import { TaskCard } from '@/types/planification';
import { useQuery } from '@tanstack/react-query';

const fetchTaskCards = async (
  company: string | undefined,
  { page = 1, perPage = 10, search }: { page?: number; perPage?: number; search?: string },
  signal?: AbortSignal,
): Promise<PaginatedResponse<TaskCard>> => {
  const response = await axios.get<PaginatedResponse<TaskCard>>(`/${company}/task-cards`, {
    params: {
      page,
      per_page: perPage,
      search: search?.trim() || undefined,
    },
    signal,
  });
  return response.data;
};

interface UseGetTaskCardsOptions {
  page?: number;
  perPage?: number;
  search?: string;
}

export const useGetTaskCards = (options: UseGetTaskCardsOptions = {}) => {
  const { selectedCompany } = useCompanyStore();
  return useQuery({
    queryKey: ['task-cards', selectedCompany?.slug, options],
    queryFn: ({ signal }) => fetchTaskCards(selectedCompany?.slug, options, signal),
    enabled: !!selectedCompany,
  });
};
