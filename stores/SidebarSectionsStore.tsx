'use client';

import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';

export const SIDEBAR_SECTIONS_STORAGE_KEY = 'sidebar_sections_state';

export type SidebarSectionsState = Record<string, boolean>;

export const EMPTY_SIDEBAR_SECTIONS_STATE: SidebarSectionsState = {};

type SidebarSectionsStoreState = {
  sections: SidebarSectionsState;
  setSectionOpen: (key: string, isOpen: boolean) => void;
};

type SidebarSectionsStoreProviderProps = {
  children: React.ReactNode;
};

const SidebarSectionsStoreContext = createContext<StoreApi<SidebarSectionsStoreState> | null>(null);

export function SidebarSectionsStoreProvider({ children }: SidebarSectionsStoreProviderProps) {
  const [store] = useState(() => createSidebarSectionsStore());

  return <SidebarSectionsStoreContext.Provider value={store}>{children}</SidebarSectionsStoreContext.Provider>;
}

export function useSidebarSectionsStore<T>(selector: (state: SidebarSectionsStoreState) => T): T {
  const store = useContext(SidebarSectionsStoreContext);

  if (!store) {
    throw new Error('useSidebarSectionsStore must be used within SidebarSectionsStoreProvider.');
  }

  return useStore(store, selector);
}

function createSidebarSectionsStore() {
  return createStore<SidebarSectionsStoreState>()(
    persist(
      (set) => ({
        sections: EMPTY_SIDEBAR_SECTIONS_STATE,
        setSectionOpen: (key, isOpen) => {
          set((state) => ({
            sections: {
              ...state.sections,
              [key]: isOpen,
            },
          }));
        },
      }),
      {
        name: SIDEBAR_SECTIONS_STORAGE_KEY,
      },
    ),
  );
}
