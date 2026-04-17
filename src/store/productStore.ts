import { create } from 'zustand';
import { PRODUCTS, CATEGORIES } from '../mocks/data';
import type { Product, Category } from '../types';
import { persist } from 'zustand/middleware';

interface ProductStore {
  products: Product[];
  categories: Category[];
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  duplicateProduct: (id: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  removeProduct: (id: string) => void;
  removeCategory: (id: string) => void;
  reorderProducts: (categoryId: string, productIds: string[]) => void;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      products: PRODUCTS,
      categories: CATEGORIES,
      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((p) => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      })),
      addProduct: (productData) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newProduct: Product = {
          ...productData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        set((state) => ({ products: [newProduct, ...state.products] }));
      },
      duplicateProduct: (id) => set((state) => {
        const original = state.products.find(p => p.id === id);
        if (!original) return state;
        const newId = Math.random().toString(36).substr(2, 9);
        const copy: Product = {
          ...original,
          id: newId,
          title: `${original.title} (копия)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { products: [copy, ...state.products] };
      }),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c)
      })),
      addCategory: (categoryData) => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newCat: Category = {
          ...categoryData,
          id
        };
        return { categories: [...state.categories, newCat] };
      }),
      removeProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
      removeCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id),
        products: state.products.filter(p => p.categoryId !== id)
      })),
      reorderProducts: (categoryId, productIds) => set((state) => {
        // This is a simplified reorder logic, in real cases we'd use a sortOrder field on products too
        // but for now we'll just reorder the array as desired
        const nonCategoryProducts = state.products.filter(p => p.categoryId !== categoryId);
        const categoryProducts = state.products.filter(p => p.categoryId === categoryId);
        const sortedCategoryProducts = productIds.map(id => categoryProducts.find(p => p.id === id)!).filter(Boolean);
        return { products: [...nonCategoryProducts, ...sortedCategoryProducts] };
      }),
    }),
    { name: 'f639-products-v4' }
  )
);
