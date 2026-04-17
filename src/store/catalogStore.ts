import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SortOption = 'popular' | 'new' | 'price_asc' | 'price_desc';

interface CatalogState {
  searchQuery: string;
  selectedCategory: string | null;
  sortBy: SortOption;
  filters: {
    minPrice: number | null;
    maxPrice: number | null;
    material: string | null;
    size: string | null;
  };
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setSortBy: (sort: SortOption) => void;
  setFilters: (filters: Partial<CatalogState['filters']>) => void;
  resetFilters: () => void;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      searchQuery: '',
      selectedCategory: null,
      sortBy: 'popular',
      filters: {
        minPrice: null,
        maxPrice: null,
        material: null,
        size: null,
      },
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSortBy: (sortBy) => set({ sortBy }),
      setFilters: (newFilters) => set((state) => ({ 
        filters: { ...state.filters, ...newFilters } 
      })),
      resetFilters: () => set({
        searchQuery: '',
        sortBy: 'popular',
        filters: {
          minPrice: null,
          maxPrice: null,
          material: null,
          size: null,
        }
      })
    }),
    { name: 'f639-catalog-storage' }
  )
);
