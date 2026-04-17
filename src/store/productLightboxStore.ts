import { create } from 'zustand';

/** Полноэкранный просмотр фото на карточке товара — «Назад» сначала закрывает его. */
export const useProductLightboxStore = create<{
  isOpen: boolean;
  activeImageIndex: number;
  setOpen: (open: boolean) => void;
  openFullscreen: (index: number) => void;
}>((set) => ({
  isOpen: false,
  activeImageIndex: 0,
  setOpen: (open) => set({ isOpen: open }),
  openFullscreen: (index) => set({ isOpen: true, activeImageIndex: index }),
}));
