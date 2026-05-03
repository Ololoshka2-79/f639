import { useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { useProductStore } from '../store/productStore';
import { CATEGORIES } from '../mocks/data';
import { shouldUseApiMockFallback } from '../lib/env';

/**
 * Merges remote catalog products with local store products.
 *
 * RULES:
 * 1. Local store = source of truth for admin CRUD operations.
 * 2. Remote API data (when available) supplements local data.
 * 3. Mock fallback data is NEVER written into the local store.
 * 4. When API returns data, it is merged: remote items = authoritative,
 *    local-only items (admin-created) are preserved.
 * 5. When API fails: if fallback is enabled, mock data is used READ-ONLY
 *    for display (not merged into store).
 */
export function useMergedCatalogProducts() {
  const localProducts = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const setCategories = useProductStore((s) => s.setCategories);
  const initialized = useRef(false);

  const { data: remoteList, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.products.list(),
    staleTime: 60_000,
    retry: 1,
  });

  const isMockFallback = useMemo(() => {
    if (!remoteList || !Array.isArray(remoteList)) {
      return false;
    }
    if (remoteList.length === 0) {
      // Empty remote = real API but no data yet. NOT mock fallback.
      return false;
    }
    // Detect mock data: hardcoded 'prod-' prefix or known mock indicators
    // Also check all items — if ANY has prod- prefix, it's likely mock
    return remoteList.every((p) => p.id?.startsWith('prod-') ?? false);
  }, [remoteList]);

  // Merge remote list into local store ONLY for real API data (never for mocks)
  useEffect(() => {
    if (remoteList !== undefined && Array.isArray(remoteList)) {
      // Only merge real API data into store — not mock fallback
      if (!isMockFallback && remoteList.length > 0) {
        const remoteIds = new Set(remoteList.map((p) => p.id));
        const localExtras = localProducts.filter((p) => !remoteIds.has(p.id));
        const merged = [...remoteList, ...localExtras];
        setProducts(merged);
      }
      // If remoteList is empty (empty JSON file), keep local products as-is
      initialized.current = true;
    }
  }, [remoteList, setProducts, isMockFallback]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize categories from mocks if store is empty
  useEffect(() => {
    const cats = useProductStore.getState().categories;
    if (!cats || cats.length === 0) {
      setCategories(CATEGORIES);
    }
  }, [setCategories]);

  const products = useMemo(() => {
    if (remoteList !== undefined && Array.isArray(remoteList)) {
      if (isMockFallback && shouldUseApiMockFallback()) {
        // Mock fallback: use local store products first, supplement with mock data
        // for products that don't exist locally (read-only)
        const localIds = new Set(localProducts.map((p) => p.id));
        const mockExtras = remoteList.filter((p) => !localIds.has(p.id));
        return [...localProducts, ...mockExtras];
      }
      if (!isMockFallback) {
        // Real API: merge remote wins, local extras preserved
        const remoteIds = new Set(remoteList.map((p) => p.id));
        const localExtras = localProducts.filter((p) => !remoteIds.has(p.id));
        return [...remoteList, ...localExtras];
      }
      // Fallback disabled: only show local products
      return localProducts;
    }
    return localProducts;
  }, [remoteList, localProducts, isMockFallback]);

  return {
    products,
    isLoading: isLoading && products.length === 0,
    isFetching,
  };
}