import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAdminTelegramUserIds } from '../lib/adminTelegramConfig';

const INITIAL_ADMIN_IDS = getAdminTelegramUserIds();

interface AdminState {
  isAdmin: boolean;
  editMode: boolean;
  allowedIds: string[];
  setAdminStatus: (status: boolean) => void;
  toggleEditMode: () => void;
  updateAllowedIds: (ids: string[]) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdmin: false,
      editMode: false,
      allowedIds: INITIAL_ADMIN_IDS,
      setAdminStatus: (isAdmin) => set({ isAdmin }),
      toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
      updateAllowedIds: (allowedIds) => set({ allowedIds }),
    }),
    { 
      name: 'f639-admin-storage-v2',
      partialize: (state) => ({ editMode: state.editMode }), // Only persist edit mode
    }
  )
);
