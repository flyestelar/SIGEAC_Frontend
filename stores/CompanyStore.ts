import { Company } from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definimos la interfaz para los módulos
interface Module {
  id: number;
  label: string;
  value: string;
}

// Actualizamos el estado para usar el objeto Company
interface CompanyState {
  selectedCompany: Company | null;
  selectedStation: string | null;
}

interface CompanyActions {
  setSelectedCompany: (company: Company) => void;
  setSelectedStation: (station: string) => void;
  reset: () => void;
}

const initialState: CompanyState = {
  selectedCompany: null,
  selectedStation: null,
};

export const useCompanyStore = create<CompanyState & CompanyActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedCompany: (company) => {
        set({ selectedCompany: company });
      },

      setSelectedStation: (station) => {
        set({ selectedStation: station });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'company-storage',
    },
  ),
);
