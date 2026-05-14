import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import type { Category } from '../types';

export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: queryKeys.categories,
    queryFn: async () => api.categories.list(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
