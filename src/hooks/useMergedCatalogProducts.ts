import { useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { useProductStore } from '../store/productStore';

/**
 * Merges remote catalog products with local store products.
 * Remote = source of truth from backend.
 * Local = admin-created products that may not yet be on backend.
 * Merges by ID: remote items take precedence, local-only items are preserved.
 */
export function useMergedCatalogProducts() {
  const localProducts = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const initialized = useRef(false);

  const { data: remoteList, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.products.list(),
    staleTime: 60_000,
    retry: 1,
  });

  // Merge remote list into local store: remote wins, local extras preserved
  useEffect(() => {
    if (remoteList !== undefined && Array.isArray(remoteList)) {
      const remoteIds = new Set(remoteList.map((p) => p.id));
      // Keep local products that are NOT in remote (admin-created without backend sync)
      const localExtras = localProducts.filter((p) => !remoteIds.has(p.id));
      const merged = [...remoteList, ...localExtras];
      setProducts(merged);
      initialized.current = true;
    }
  }, [remoteList, setProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = useMemo(() => {
    if (remoteList !== undefined && Array.isArray(remoteList)) {
      const remoteIds = new Set(remoteList.map((p) => p.id));
      const localExtras = localProducts.filter((p) => !remoteIds.has(p.id));
      return [...remoteList, ...localExtras];
    }
    return localProducts;
  }, [remoteList, localProducts]);

  return {
    products,
    isLoading: isLoading && products.length === 0,
    isFetching,
  };
}
