'use client';

import { COMPANY_ID_COOKIE } from '@/lib/cookies/constants';
import { Company } from '@/types';
import Cookies from 'js-cookie';
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

const setComanyIdCookie = (company: Company) => {
  Cookies.set(COMPANY_ID_COOKIE, company.id.toString(), {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
};

export const useCompanyStore = create<CompanyState & CompanyActions>()(
  persist(
    (set) => ({
      ...initialState,

      setSelectedCompany: (company) => {
        set({ selectedCompany: company });
        setComanyIdCookie(company);
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
      onRehydrateStorage: () => (state) => {
        if (state?.selectedCompany) {
          setComanyIdCookie(state.selectedCompany);
        } else {
          Cookies.remove(COMPANY_ID_COOKIE);
        }
      },
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
