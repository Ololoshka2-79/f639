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
  trackEvent: (evt: Partial<AnalyticsEvent> & { event: AnalyticsEventType; userId: string }) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      events: [],
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
        
        return {
          events: [...filteredEvents, newEvent]
        };
      })
    }),
    {
      name: 'f639-analytics-db',
    }
  )
);
