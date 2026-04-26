import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (product: Product, size?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  /** Удаляет из корзины товары, которых нет в актуальном каталоге */
  syncWithCatalog: (validProductIds: Set<string>) => void;
}

/** Вспомогательная функция для пересчёта total и возврата нового состояния */
function recalc(items: CartItem[]): Pick<CartStore, 'items' | 'total'> {
  return {
    items,
    total: items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      addItem: (product, size) => {
        const items = get().items;
        const existing = items.find(i => i.productId === product.id && i.size === size);
        let newItems;
        if (existing) {
          newItems = items.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          newItems = [...items, { id: Math.random().toString(36).substr(2, 9), productId: product.id, product, size, quantity: 1 }];
        }
        set(recalc(newItems));
      },
      removeItem: (itemId) => {
        const newItems = get().items.filter(i => i.id !== itemId);
        set(recalc(newItems));
      },
      updateQuantity: (itemId, quantity) => {
        const newItems = get().items.map(i => i.id === itemId ? { ...i, quantity } : i);
        set(recalc(newItems));
      },
      clearCart: () => set({ items: [], total: 0 }),
      syncWithCatalog: (validProductIds) => {
        const current = get().items;
        const filtered = current.filter(item => validProductIds.has(item.productId));
        if (filtered.length !== current.length) {
          set(recalc(filtered));
        }
      },
    }),
    {
      name: 'f639-cart-storage',
      partialize: (state) => ({
        items: state.items,
        total: state.items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
      }),
    }
  )
);
