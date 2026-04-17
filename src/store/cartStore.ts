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
        set({ items: newItems, total: newItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0) });
      },
      removeItem: (itemId) => {
        const newItems = get().items.filter(i => i.id !== itemId);
        set({ items: newItems, total: newItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0) });
      },
      updateQuantity: (itemId, quantity) => {
        const newItems = get().items.map(i => i.id === itemId ? { ...i, quantity } : i);
        set({ items: newItems, total: newItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0) });
      },
      clearCart: () => set({ items: [], total: 0 }),
    }),
    { name: 'f639-cart-storage' }
  )
);
