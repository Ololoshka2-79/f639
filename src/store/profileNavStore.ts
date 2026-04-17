import { create } from 'zustand';

/** Подэкраны профиля (мои заказы, адреса, настройки) — для нативной «Назад». */
export const useProfileNavStore = create<{
  subScreen: string | null;
  openSubScreen: (id: string) => void;
  closeSubScreen: () => void;
}>((set) => ({
  subScreen: null,
  openSubScreen: (id) => set({ subScreen: id }),
  closeSubScreen: () => set({ subScreen: null }),
}));
