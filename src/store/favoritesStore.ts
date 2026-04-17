import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types';

interface FavoritesStore {
  items: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleFavorite: (product) => {
        const items = get().items;
        const index = items.findIndex(i => i.id === product.id);
        if (index === -1) {
          set({ items: [...items, product] });
        } else {
          set({ items: items.filter(i => i.id !== product.id) });
        }
      },
      isFavorite: (productId) => get().items.some(i => i.id === productId),
    }),
    { name: 'f639-favorites-storage' }
  )
);
