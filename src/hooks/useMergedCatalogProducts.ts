import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { useProductStore } from '../store/productStore';
import { CATEGORIES } from '../mocks/data';
import { useEffect } from 'react';
import type { Product } from '../types';

/**
 * ЕДИНСТВЕННЫЙ источник товаров — React Query + server API.
 *
 * АРХИТЕКТУРА:
 * - NO Zustand merge, NO localStorage, NO "whoever is bigger" logic.
 * - Все компоненты (admin, catalog, home, product page) используют этот хук.
 * - React Query cache — единый source of truth для всех клиентов.
 * - staleTime: 5s → near-realtime sync после мутаций.
 *
 * Categories инициализируются из моков при первом монтировании (store-only).
 */
export function useProductList() {
  const setCategories = useProductStore((s) => s.setCategories);

  const query = useQuery<Product[], Error>({
    queryKey: queryKeys.products,
    queryFn: async (): Promise<Product[]> => api.products.list(),
    staleTime: 15_000,
    refetchInterval: 15_000,
    retry: 2,
  });

  // Initialize categories from mocks if store is empty
  useEffect(() => {
    const cats = useProductStore.getState().categories;
    if (!cats || cats.length === 0) {
      setCategories(CATEGORIES);
    }
  }, [setCategories]);

  return query;
}

export { useProductList as useMergedCatalogProducts };