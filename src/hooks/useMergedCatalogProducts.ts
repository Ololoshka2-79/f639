import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';

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
  const query = useQuery<Product[], Error>({
    queryKey: queryKeys.products,
    queryFn: async (): Promise<Product[]> => api.products.list(),
    staleTime: 15_000,
    refetchInterval: 15_000,
    retry: 2,
  });

  return query;
}

export { useProductList as useMergedCatalogProducts };