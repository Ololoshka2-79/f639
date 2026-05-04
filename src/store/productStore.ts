import { create } from 'zustand';
import type { Product, Category } from '../types';

interface ProductStore {
  /* ---- Products ---- */
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  reorderProducts: (from: number, to: number) => void;

  /* ---- Categories ---- */
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
}

export const useProductStore = create<ProductStore>()((set, get) => ({
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

  /* ---- Categories ---- */
  categories: [],
  setCategories: (categories) => set({ categories }),

  addCategory: (categoryData) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newCat: Category = { ...categoryData, id };
    set((state) => ({ categories: [...state.categories, newCat] }));
  },

  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),

  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter((c) => c.id !== id),
  })),
}));