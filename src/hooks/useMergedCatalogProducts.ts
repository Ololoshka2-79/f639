import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { useProductStore } from '../store/productStore';
import { CATEGORIES } from '../mocks/data';

/**
 * ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ для каталога товаров.
 *
 * АРХИТЕКТУРА:
 * 1. API (server/data/products.json) — ЕДИНСТВЕННЫЙ авторитетный источник.
 * 2. React Query кеш — авторитетный кеш для ВСЕХ пользователей (админ + обычные).
 * 3. Zustand store (localStorage) — ТОЛЬКО как дубликат API для optimistic UI
 *    при CRUD-операциях. ПОЛНОСТЬЮ перезаписывается при каждом ответе API.
 * 4. НИКАКИХ моков в production — только API.
 * 5. НИКАКИХ localExtras — это источник рассинхронизации.
 * 6. Все компоненты (CatalogPage, AdminProductsPage) используют ЭТОТ хук.
 */
export function useMergedCatalogProducts() {
  const setProducts = useProductStore((s) => s.setProducts);
  const setCategories = useProductStore((s) => s.setCategories);
  const initialized = useRef(false);

  const { data: remoteList, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.products.list(),
    staleTime: 5_000, // 5 sec — быстрая синхронизация между ВСЕМИ пользователями
    retry: 2,
    // НЕ используем моки. Если API не отвечает — показываем то, что есть в store.
  });

  // ПОЛНОСТЬЮ перезаписываем Zustand store при КАЖДОМ успешном ответе API.
  // НИКАКИХ мержей с localExtras — это вызывает рассинхронизацию.
  // API — единственный авторитетный источник.
  useEffect(() => {
    if (remoteList === undefined || !Array.isArray(remoteList)) return;

    if (remoteList.length > 0) {
      // Перезаписываем store данными из API (не мержим!)
      setProducts(remoteList);
    } else if (remoteList.length === 0) {
      // API вернул пустой массив — синхронизируем store
      setProducts([]);
    }
    initialized.current = true;
  }, [remoteList, setProducts]);

  // Initialize categories from mocks if store is empty (categories не CRUD, статика)
  useEffect(() => {
    const cats = useProductStore.getState().categories;
    if (!cats || cats.length === 0) {
      setCategories(CATEGORIES);
    }
  }, [setCategories]);

  // Возвращаем ТОЛЬКО данные из API (React Query).
  // Никаких смешиваний с localStorage или моками.
  return {
    products: remoteList ?? [],
    isLoading: isLoading && (remoteList === undefined || remoteList.length === 0),
    isFetching,
  };
}
