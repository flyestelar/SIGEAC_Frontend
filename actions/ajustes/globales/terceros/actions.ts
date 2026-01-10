import axiosInstance from '@/lib/axios';
import { useCompanyStore } from '@/stores/CompanyStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ThirdPartyData {
  name: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  party_roles_ids: string[];
}

export const useCreateThirdParty = () => {
  const { selectedCompany } = useCompanyStore();
  const queryCategory = useQueryClient();
  const createMutation = useMutation({
    mutationFn: async (data: ThirdPartyData) => {
      await axiosInstance.post(`/${selectedCompany?.slug}/third-parties`, data);
    },
    onSuccess: () => {
      queryCategory.invalidateQueries({ queryKey: ['third-parties'] });
      toast('¡Creado!', {
        description: `¡El tercero se ha creado correctamente!`,
      });
    },
    onError: (error) => {
      toast('Error:(', {
        description: `No se creo correctamente: ${error}`,
      });
    },
  });
  return {
    createThirdParty: createMutation,
  };
};
