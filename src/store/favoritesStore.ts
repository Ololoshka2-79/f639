import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types';

interface FavoritesStore {
  items: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  /** Удаляет из избранного товары, которых нет в актуальном каталоге */
  syncWithCatalog: (validProductIds: Set<string>) => void;
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
      syncWithCatalog: (validProductIds) => {
        const current = get().items;
        const filtered = current.filter(product => validProductIds.has(product.id));
        if (filtered.length !== current.length) {
          set({ items: filtered });
        }
      },
    }),
    { name: 'f639-favorites-storage' }
  )
);

