import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subDays, isAfter, parseISO } from 'date-fns';

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
  uniqueUserIds: string[]; // Persistent registry of all known users
  trackEvent: (evt: Partial<AnalyticsEvent> & { event: AnalyticsEventType; userId: string }) => void;
  resetAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      events: [],
      uniqueUserIds: [],
      resetAnalytics: () => set({ events: [], uniqueUserIds: [] }),
      trackEvent: (evt) => set((state) => {
        const now = new Date();
        const threshold = subDays(now, 3);
        const newEvent = { 
          ...evt, 
          id: crypto.randomUUID(), 
          createdAt: now.toISOString() 
        };
        
        // Keep only events within last 3 days
        const filteredEvents = state.events.filter(e => isAfter(parseISO(e.createdAt), threshold));
        
        // Update unique user registry
        const newUniqueUserIds = state.uniqueUserIds.includes(evt.userId) 
          ? state.uniqueUserIds 
          : [...state.uniqueUserIds, evt.userId];
        
        return {
          events: [...filteredEvents, newEvent],
          uniqueUserIds: newUniqueUserIds
        };
      })
    }),
    {
      name: 'f639-analytics-db',
    }
  )
);
