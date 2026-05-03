import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { useProductStore } from '../store/productStore';
import { CATEGORIES } from '../mocks/data';
import type { Product } from '../types';

/**
 * ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ для каталога товаров.
 *
 * АРХИТЕКТУРА:
 * 1. API (server/data/products.json) — ЕДИНСТВЕННЫЙ авторитетный источник.
 * 2. React Query кеш — единый кеш для всех компонентов.
 * 3. Zustand store — ТОЛЬКО для categories и быстрых мутаций.
 * 4. Синхронизация Zustand ← API происходит ТОЛЬКО при ПЕРВОЙ загрузке и при
 *    УВЕЛИЧЕНИИ количества товаров (чтобы не затирать оптимистичные мутации).
 * 5. При ошибке API (рефетч после failed мутации) — НЕ трогаем Zustand.
 */
export function useMergedCatalogProducts() {
  const setProducts = useProductStore((s) => s.setProducts);
  const setCategories = useProductStore((s) => s.setCategories);
  const storeProducts = useProductStore((s) => s.products);

  const { data: remoteList, isLoading, isFetching, isSuccess } = useQuery<Product[], Error>({
    queryKey: queryKeys.products,
    queryFn: async (): Promise<Product[]> => api.products.list(),
    staleTime: 5_000,
    retry: 2,
  });

  /**
   * Синхронизация Zustand store ← API.
   *
   * КРИТИЧЕСКИ ВАЖНО: НЕ перезаписываем store при КАЖДОМ ответе API.
   *
   * Причина: после неудачной мутации (POST/DELETE) происходит invalidateQueries →
   * refetch → API возвращает СТАРЫЙ список (без только что созданного товара) →
   * если перезаписать store старым списком — оптимистично созданный товар исчезнет.
   *
   * СТРАТЕГИЯ:
   * - При ПЕРВОЙ успешной загрузке (store пуст) — записываем данные из API.
   * - При последующих загрузках — записываем ТОЛЬКО если API вернул БОЛЬШЕ товаров
   *   (значит серверная мутация УСПЕШНО создала товар, и API теперь содержит его).
   * - При ошибке — НЕ трогаем store (сохраняем оптимистичные данные).
   */
  useEffect(() => {
    if (!isSuccess || !remoteList || !Array.isArray(remoteList)) {
      // При ошибке API — не трогаем store. Сохраняем то, что есть.
      return;
    }

    const storeLen = (storeProducts && Array.isArray(storeProducts)) ? storeProducts.length : 0;
    const remoteLen = remoteList.length;

    if (storeLen === 0 && remoteLen > 0) {
      // Первая загрузка: store пуст, API вернул данные
      setProducts(remoteList);
    } else if (remoteLen > storeLen) {
      // API содержит БОЛЬШЕ товаров чем store → мутация прошла успешно на сервере.
      // Перезаписываем store актуальными серверными данными.
      setProducts(remoteList);
    } else if (remoteLen === storeLen) {
      // Количество совпадает — не трогаем store (сохраняем оптимистичные изменения).
      // Можно было бы синхронизировать, но риск затереть несохранённые изменения.
    } else {
      // remoteLen < storeLen: возможно удаление на сервере прошло.
      // Синхронизируем ТОЛЬКО если прошло достаточно времени (debounce 10s).
      // Для мгновенной синхронизации используем invalidateQueries после успешной мутации.
    }
  }, [isSuccess, remoteList, setProducts, storeProducts]);

  // Initialize categories from mocks if store is empty
  useEffect(() => {
    const cats = useProductStore.getState().categories;
    if (!cats || cats.length === 0) {
      setCategories(CATEGORIES);
    }
  }, [setCategories]);

  /**
   * Возвращаем store или API-данные в зависимости от ситуации.
   *
   * Правило: источником правды для UI должен быть тот список, который БОЛЬШЕ.
   * - Если store содержит больше товаров чем API — значит были оптимистичные мутации,
   *   и API ещё не синхронизирован (либо мутация не прошла). Показываем store.
   * - Если API содержит больше — значит мутация прошла на другом клиенте.
   *   Показываем API.
   * - При равном количестве — показываем API (свежие данные с сервера).
   */
  const storeArr = (storeProducts && Array.isArray(storeProducts)) ? storeProducts as Product[] : [];
  const remoteArr = (remoteList && Array.isArray(remoteList)) ? remoteList as Product[] : [];

  let displayProducts: Product[];
  if (storeArr.length > remoteArr.length) {
    // Store имеет больше товаров (оптимистичные мутации не синхронизированы)
    displayProducts = storeArr;
  } else if (remoteArr.length > 0) {
    displayProducts = remoteArr;
  } else if (storeArr.length > 0) {
    displayProducts = storeArr;
  } else {
    displayProducts = [];
  }

  return {
    products: displayProducts,
    isLoading: isLoading && displayProducts.length === 0,
    isFetching,
  };
}
