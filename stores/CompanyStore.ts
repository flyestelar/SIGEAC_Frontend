'use client';

import { Company } from '@/types';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export function useCompanySlug() {
  return useCompanyStore((state) => state.selectedCompany?.slug);
}

export function useCompanyIsHydrated() {
  return useSyncExternalStore(
    useCompanyStore.persist.onFinishHydration,
    useCompanyStore.persist.hasHydrated,
    () => false,
  );
}
