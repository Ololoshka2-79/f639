import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { mergeCatalogLists } from '../lib/catalogMerge';
import { useProductStore } from '../store/productStore';

export function useMergedCatalogProducts() {
  const localProducts = useProductStore((s) => s.products);

  const { data: remoteList, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.products.list(),
    staleTime: 60_000,
  });

  const products = useMemo(
    () => mergeCatalogLists(remoteList, localProducts),
    [remoteList, localProducts]
  );

  return {
    products,
    isLoading: isLoading && products.length === 0,
    isFetching,
  };
}
