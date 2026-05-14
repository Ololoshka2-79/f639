import { create } from 'zustand';
import type { Product } from '../types';

interface ProductStore {
  /* ---- Products ---- */
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  reorderProducts: (from: number, to: number) => void;

}

export const useProductStore = create<ProductStore>()((set, _get) => ({
  /* ---- Products ---- */
  products: [],
  setProducts: (products) => set({ products }),

  addProduct: (product) => set((state) => ({
    products: [...state.products, product],
  })),

  updateProduct: (id, updates) => set((state) => ({
    products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),

  removeProduct: (id) => set((state) => ({
    products: state.products.filter((p) => p.id !== id),
  })),

  duplicateProduct: (id) => set((state) => {
    const original = state.products.find((p) => p.id === id);
    if (!original) return state;
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const dup: Product = {
      ...original,
      id: newId,
      title: `${original.title} (копия)`,
      slug: `${original.slug}-copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { products: [...state.products, dup] };
  }),

  reorderProducts: (from, to) => set((state) => {
    const updated = [...state.products];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    return { products: updated };
  }),

}));