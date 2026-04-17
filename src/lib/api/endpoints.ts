import { apiClient } from './client';
import type { Product, Category, OrderStatus, PaymentStatus } from '../../types';
import { shouldUseApiMockFallback } from '../env';
import {
  getFallbackCategories,
  getFallbackProductsList,
  getFallbackProductById,
  getFallbackRelated,
  FALLBACK_PVZ,
  getFallbackOrderStatus,
  getFallbackPaymentStatus,
} from '../../mocks/apiFallback';

export interface ProductListParams {
  category?: string;
  search?: string;
  price_min?: number;
  price_max?: number;
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface UploadedImage {
  url: string;
  public_id: string;
}

function normalizeUploadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.trim();
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('load failed') || lower.includes('networkerror')) {
    return 'Сеть недоступна или API блокирует CORS. Проверьте ALLOWED_ORIGINS и доступность backend.';
  }
  if (lower.includes('forbidden')) {
    return 'Доступ запрещен. Проверьте TELEGRAM_BOT_TOKEN, ADMIN_IDS и что запуск внутри Telegram WebApp.';
  }
  if (lower.includes('file is too large') || lower.includes('413')) {
    return 'Файл слишком большой. Максимум 5MB.';
  }
  if (lower.includes('only image files')) {
    return 'Разрешены только изображения.';
  }
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
    return 'В Telegram backend на localhost недоступен. Нужен публичный HTTPS URL.';
  }

  return message || 'Upload failed';
}

function resolveUploadBaseUrl(): string {
  const explicit = (import.meta.env.VITE_UPLOAD_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8787';
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (!apiBase) return '';
  return apiBase;
}

function resolveUploadCandidates(): string[] {
  const explicit = (import.meta.env.VITE_UPLOAD_BASE_URL || '').trim();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  const fallback = resolveUploadBaseUrl();
  const values = [
    explicit,
    apiBase ? `${apiBase}/upload` : '',
    apiBase ? `${apiBase.replace(/\/v1$/i, '')}/upload` : '',
    fallback ? `${fallback}/upload` : '',
  ]
    .map((s) => s.replace(/\/{2,}/g, '/').replace('https:/', 'https://').replace('http:/', 'http://'))
    .filter(Boolean);
  return Array.from(new Set(values));
}

function handleFallback<T>(err: unknown, fallback: () => T): T {
  if (!shouldUseApiMockFallback()) {
    throw err;
  }
  console.warn('[API] request failed, using mock fallback', err);
  return fallback();
}

export const api = {
  categories: {
    list: async () => {
      try {
        const response = await apiClient.get<Category[]>('/categories');
        return response.data;
      } catch (err) {
        return handleFallback(err, () => getFallbackCategories());
      }
    },
  },
  products: {
    list: async (params: ProductListParams = {}) => {
      try {
        const response = await apiClient.get<Product[]>('/products', { params });
        return response.data;
      } catch (err) {
        return handleFallback(err, () => getFallbackProductsList(params));
      }
    },
    getById: async (id: string) => {
      try {
        const response = await apiClient.get<Product>(`/products/${id}`);
        return response.data;
      } catch (err) {
        return handleFallback(err, () => getFallbackProductById(id));
      }
    },
    get: async (id: string) => {
      return api.products.getById(id);
    },
    related: async (id: string) => {
      try {
        const response = await apiClient.get<Product[]>(`/products/${id}/related`);
        return response.data;
      } catch (err) {
        return handleFallback(err, () => getFallbackRelated(id));
      }
    },
    upsert: async (product: Product) => {
      const response = await apiClient.post<Product>('/products', product);
      return response.data;
    },
    remove: async (id: string) => {
      await apiClient.delete(`/product/${id}`);
    },
  },
  admin: {
    uploadImage: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const initData = window.Telegram?.WebApp?.initData || '';
        const candidates = resolveUploadCandidates();
        let lastError = 'Upload failed';

        for (const url of candidates) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              mode: 'cors',
              headers: {
                'x-telegram-init-data': initData,
              },
              body: formData,
            });

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              const message =
                typeof payload?.message === 'string'
                  ? payload.message
                  : `Upload failed with status ${response.status}`;
              lastError = `${url} -> ${message}`;
              continue;
            }

            const data = (await response.json()) as UploadedImage;
            return data;
          } catch (networkError) {
            lastError = `${url} -> ${normalizeUploadError(networkError)}`;
          }
        }

        throw new Error(lastError);
      } catch (error) {
        throw new Error(normalizeUploadError(error));
      }
    },
  },
  delivery: {
    getPvz: async () => {
      try {
        const response = await apiClient.get<unknown[]>('/delivery/pvz');
        return response.data;
      } catch (err) {
        return handleFallback(err, () => FALLBACK_PVZ);
      }
    },
  },
  orders: {
    /** Заказ создаётся всегда локально при сбое API (статический деплой без бэкенда). */
    create: async (orderData: unknown) => {
      try {
        const response = await apiClient.post<{ orderId?: string; id?: string }>('/orders', orderData, {
          timeout: 25_000,
        });
        const raw = response.data;
        const orderId = raw?.orderId ?? raw?.id ?? `order-${Date.now()}`;
        return { orderId };
      } catch (err) {
        console.warn('[API] orders.create failed, using client-side order id', err);
        return {
          orderId: `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        };
      }
    },
    getStatus: async (id: string) => {
      try {
        const response = await apiClient.get<{ status: OrderStatus }>(`/orders/${id}/status`);
        return response.data;
      } catch (err) {
        return handleFallback(err, () => getFallbackOrderStatus(id));
      }
    },
  },
  payments: {
    create: async (orderId: string) => {
      try {
        const response = await apiClient.post<{
          paymentId: string;
          qrImage: string;
          deepLink: string;
          expiresAt: string;
        }>('/payments', { orderId });
        return response.data;
      } catch (err) {
        return handleFallback(err, () => ({
          paymentId: `pay-mock-${Date.now()}`,
          qrImage: '/payment/qr-sbp-vtb.svg',
          deepLink: 'https://sbp.nspk.ru/pay/mock',
          expiresAt: new Date(Date.now() + 900000).toISOString(),
        }));
      }
    },
    getStatus: async (id: string) => {
      try {
        const response = await apiClient.get<{ status: PaymentStatus }>(`/payments/${id}/status`);
        return response.data;
      } catch (err) {
        return handleFallback(err, () => getFallbackPaymentStatus(id));
      }
    },
  },
};
