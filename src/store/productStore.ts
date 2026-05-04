import { create } from 'zustand';
import type { Category } from '../types';

/**
 * Zustand store — ТОЛЬКО для категорий.
 *
 * АРХИТЕКТУРА:
 * - Products: ЕДИНСТВЕННЫЙ источник — API (server/data/products.json).
 *   Клиент получает товары через React Query (useQuery).
 *   Мутации — через useMutation с optimistic update + rollback.
 *   NO persist, NO localStorage для товаров.
 *
 * - Categories: статические данные из моков (CATEGORIES).
 *   Хранятся в Zustand без persist (переинициализируются при монтировании).
 *   Админ может добавлять/удалять/переименовывать категории (store-only, не синхронизируются с сервером).
 */
interface CategoryStore {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
}

export const useProductStore = create<CategoryStore>()((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (categoryData) => set((state) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newCat: Category = { ...categoryData, id };
    return { categories: [...state.categories, newCat] };
  }),
  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter((c) => c.id !== id)
  })),
}));