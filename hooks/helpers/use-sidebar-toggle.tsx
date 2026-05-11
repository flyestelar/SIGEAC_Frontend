import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface useSidebarToggleStore {
  isOpen: boolean;
  toggleOpen: () => void;
  setIsOpen: (open: boolean) => void;
}

export const useSidebarToggle = create(
  persist<useSidebarToggleStore>(
    (set, get) => ({
      isOpen: true,
      toggleOpen: () => {
        set({ isOpen: !get().isOpen });
      },
      setIsOpen: (open: boolean) => {
        set({ isOpen: open });
      }
    }),
    {
      name: 'sidebarOpen',
      storage: createJSONStorage(() => localStorage)
    }
  )
);