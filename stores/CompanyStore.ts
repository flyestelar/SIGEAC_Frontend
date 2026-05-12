import { Company } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompanyState {
  selectedCompany: Company | null;
  selectedStation: string;

  setSelectedCompany: (
    company: Company | null
  ) => void;

  setSelectedStation: (
    station: string
  ) => void;

  reset: () => void;
}

const initialState = {
  selectedCompany: null,
  selectedStation: "",
};

export const useCompanyStore =
  create<CompanyState>()(
    persist(
      (set) => ({
        ...initialState,

        setSelectedCompany: (
          company: Company | null
        ) => {
          set({
            selectedCompany: company,
          });
        },

        setSelectedStation: (
          station: string
        ) => {
          set({
            selectedStation: station,
          });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: "company-storage",

        partialize: (state) => ({
          selectedCompany:
            state.selectedCompany,

          selectedStation:
            state.selectedStation,
        }),
      }
    )
  );