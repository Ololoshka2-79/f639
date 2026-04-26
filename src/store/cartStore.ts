import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  /** Удаляет из корзины товары, которых нет в актуальном каталоге */
  syncWithCatalog: (validProductIds: Set<string>) => void;
}



export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, size) => {
        const items = get().items;
        const existing = items.find(i => i.productId === product.id && i.size === size);
        let newItems;
        if (existing) {
          newItems = items.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          newItems = [...items, { id: Math.random().toString(36).substr(2, 9), productId: product.id, size, quantity: 1 }];
        }
        set({ items: newItems });
      },
      removeItem: (itemId) => {
        const newItems = get().items.filter(i => i.id !== itemId);
        set({ items: newItems });
      },
      updateQuantity: (itemId, quantity) => {
        const newItems = get().items.map(i => i.id === itemId ? { ...i, quantity } : i);
        set({ items: newItems });
      },
      clearCart: () => set({ items: [] }),
      syncWithCatalog: (validProductIds) => {
        const current = get().items;
        const filtered = current.filter(item => validProductIds.has(item.productId));
        if (filtered.length !== current.length) {
          set({ items: filtered });
        }
      },
    }),
    {
      name: 'f639-cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
