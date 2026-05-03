import { create } from 'zustand';
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
      products: [],
      categories: [],
      setProducts: (products) => set({ products }),
      setCategories: (categories) => set({ categories }),
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((p) => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      })),
      addProduct: (productData) => {
        set((state) => {
          const id = (productData as any).id || Math.random().toString(36).substr(2, 9);
          
          if (state.products.find(p => p.id === id)) {
            console.log(`[ProductStore] Product with id ${id} already exists. Skipping.`);
            return state;
          }

          const newProduct: Product = {
            ...productData,
            id,
            createdAt: (productData as any).createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Product;

          return { products: [newProduct, ...state.products] };
        });
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
    {
      name: 'f639-products-v6',
      // Migrate old data: ensure images array exists and gallery is always an array
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<typeof current>;
        const products = (p.products ?? current.products).map((prod) => {
          const gallery = Array.isArray(prod.gallery) ? prod.gallery : [];
          const gallery_public_ids = Array.isArray(prod.gallery_public_ids) ? prod.gallery_public_ids : [];
          
          // Migration: if images array is missing, build it from image and gallery
          let images = prod.images;
          if (!Array.isArray(images) || images.length === 0) {
            images = [];
            if (prod.image) {
              images.push({ url: prod.image, public_id: (prod as any).image_public_id || '', order: 0 });
            }
            gallery.forEach((url, i) => {
              images.push({ url, public_id: gallery_public_ids[i] || '', order: i + 1 });
            });
          } else {
            images = images.map((img: any, idx: number) => ({ ...img, order: img.order ?? idx }));
          }

          return {
            ...prod,
            gallery,
            gallery_public_ids,
            images,
          };
        });

        return {
          ...current,
          ...p,
          products,
        };
      },
    }
  )
);
