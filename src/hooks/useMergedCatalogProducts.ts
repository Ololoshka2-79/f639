import { useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { useProductStore } from '../store/productStore';
import { CATEGORIES } from '../mocks/data';
import { shouldUseApiMockFallback } from '../lib/env';
import { getFallbackProductsList } from '../mocks/apiFallback';

/**
 * ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ для каталога товаров.
 *
 * ПРИНЦИПЫ:
 * 1. API (server/data/products.json) — единственный авторитетный источник.
 *    Store (Zustand + localStorage) — локальный кеш.
 * 2. При успешном ответе API → ВСЕГДА мержим в store:
 *    API-товары имеют приоритет над локальными с тем же ID,
 *    локальные экстры (созданные админом) сохраняются.
 * 3. Мок-детекция по префиксу 'prod-' УДАЛЕНА — она ломала мерж,
 *    поскольку серверный products.json засеян теми же мок-данными.
 * 4. При ошибке API → моки ТОЛЬКО для отображения (read-only),
 *    если VITE_API_FALLBACK_TO_MOCKS=true. Моки НЕ пишутся в store.
 * 5. После мутаций (CRUD) → queryClient.invalidateQueries для синхронизации
 *    всех клиентов (вызывается из AdminProductsPage).
 */
export function useMergedCatalogProducts() {
  const localProducts = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const setCategories = useProductStore((s) => s.setCategories);
  const initialized = useRef(false);

  const { data: remoteList, isLoading, isFetching, isError } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.products.list(),
    staleTime: 15_000, // 15 sec — быстрая синхронизация между пользователями
    retry: 1,
  });

  // Merge remote list into local store on EVERY successful API response.
  // No mock detection — if API returned data, it's authoritative.
  useEffect(() => {
    if (remoteList === undefined || !Array.isArray(remoteList)) return;

    if (remoteList.length > 0) {
      // API вернул товары — мержим в store
      const remoteIds = new Set(remoteList.map((p) => p.id));
      const localExtras = localProducts.filter((p) => !remoteIds.has(p.id));
      const merged = [...remoteList, ...localExtras];
      setProducts(merged);
    } else if (remoteList.length === 0 && localProducts.length > 0) {
      // API пуст (все товары удалены) → синхронизируем store
      setProducts([]);
    }
    initialized.current = true;
  }, [remoteList, setProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize categories from mocks if store is empty
  useEffect(() => {
    const cats = useProductStore.getState().categories;
    if (!cats || cats.length === 0) {
      setCategories(CATEGORIES);
    }
  }, [setCategories]);

  const products = useMemo(() => {
    // API успешно ответил и есть данные
    if (remoteList !== undefined && Array.isArray(remoteList) && remoteList.length > 0) {
      const remoteIds = new Set(remoteList.map((p) => p.id));
      const localExtras = localProducts.filter((p) => !remoteIds.has(p.id));
      return [...remoteList, ...localExtras];
    }

    // API не ответил или вернул ошибку — fallback к мокам (read-only)
    if (isError && shouldUseApiMockFallback()) {
      const localIds = new Set(localProducts.map((p) => p.id));
      const mockExtras = getFallbackProductsList({}).filter((p) => !localIds.has(p.id));
      return [...localProducts, ...mockExtras];
    }

    // Нет API, нет fallback — только локальный store
    return localProducts;
  }, [remoteList, localProducts, isError]);

  return {
    products,
    isLoading: isLoading && products.length === 0,
    isFetching,
  };
}
