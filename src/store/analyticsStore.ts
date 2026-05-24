import { create } from 'zustand';
import { api } from '../lib/api/endpoints';

export type AnalyticsEventType = 'app_open' | 'view_product' | 'add_to_cart' | 'open_checkout' | 'select_pvz' | 'create_order';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  username?: string;
  firstName?: string;
  phone?: string;
  event: AnalyticsEventType;
  productId?: string;
  orderId?: string;
  deliveryType?: 'pickup' | 'courier';
  pvzAddress?: string;
  amount?: number;
  createdAt: string;
}

interface AnalyticsState {
  events: AnalyticsEvent[];
  uniqueUserIds: string[];
  trackEvent: (evt: Partial<AnalyticsEvent> & { event: AnalyticsEventType; userId: string }) => void;
  fetchAnalytics: () => Promise<void>;
  resetAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()((set) => ({
  events: [],
  uniqueUserIds: [],
  resetAnalytics: async () => {
    try {
      await api.analytics.reset();
    } catch (err) {
      console.error('[AnalyticsStore] Failed to reset analytics on server', err);
    }
    set({ events: [], uniqueUserIds: [] });
  },
  fetchAnalytics: async () => {
    try {
      const data = await api.analytics.getAdmin();
      const userIds = Array.from(new Set(data.map((e: AnalyticsEvent) => e.userId)));
      set({ events: data, uniqueUserIds: userIds as string[] });
    } catch (err) {
      console.error('[AnalyticsStore] Failed to fetch analytics', err);
    }
  },
  trackEvent: (evt) => {
    // Асинхронно отправляем событие на сервер
    api.analytics.track(evt);
    
    // Оптимистично добавляем событие в локальный стейт (чтобы интерфейс сразу обновился, если открыт)
    set((state) => {
      const newEvent = { 
        ...evt, 
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString() 
      } as AnalyticsEvent;
      
      const newUniqueUserIds = state.uniqueUserIds.includes(evt.userId) 
        ? state.uniqueUserIds 
        : [...state.uniqueUserIds, evt.userId];
      
      return {
        events: [newEvent, ...state.events], // Новые события добавляем в начало, так как сервер возвращает DESC
        uniqueUserIds: newUniqueUserIds
      };
    });
  }
}));
