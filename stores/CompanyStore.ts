'use client';

import { Company } from '@/types';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { COMPANY_ID_COOKIE } from '@/lib/cookies/constants';

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
        Cookies.set(COMPANY_ID_COOKIE, company.id.toString(), {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      },

      setSelectedStation: (station) => {
        set({ selectedStation: station });
      },

      reset: () => {
        set(initialState);
        Cookies.remove(COMPANY_ID_COOKIE);
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
    useCompanyStore.persist?.onFinishHydration,
    useCompanyStore.persist?.hasHydrated,
    () => false,
  );
}
