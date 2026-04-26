import type { Product } from '../types';
import { useAnalyticsStore } from '../store/analyticsStore';
import type { AnalyticsEventType } from '../store/analyticsStore';

/**
 * Helper to dispatch analytics events from anywhere in the app
 */
export const trackEvent = (evt: { 
  event: AnalyticsEventType; 
  productId?: string; 
  orderId?: string; 
  deliveryType?: 'pickup' | 'courier';
  pvzAddress?: string;
  amount?: number;
}) => {
  // Use Telegram User ID if available, otherwise 'guest'
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;
  const userId = user?.id?.toString() || 'guest';
  const username = user?.username;
  const firstName = user?.first_name;
  
  useAnalyticsStore.getState().trackEvent({ ...evt, userId, username, firstName });
};

export const analytics = {
  trackAppOpen: () => {
    trackEvent({ event: 'app_open' });
  },
  trackViewItem: (product: Product) => {
    trackEvent({ event: 'view_product', productId: product.id, amount: product.price });
  },
  trackAddToCart: (product: Product, quantity: number) => {
    trackEvent({ event: 'add_to_cart', productId: product.id, amount: product.price * quantity });
  },
  trackBeginCheckout: (items: any[], total: number) => {
    void items;
    trackEvent({ event: 'open_checkout', amount: total });
  },
  trackSelectPvz: (pvzId: string, address: string) => {
    void pvzId;
    trackEvent({ event: 'select_pvz', deliveryType: 'pickup', pvzAddress: address });
  },
  trackPurchase: (orderId: string, total: number, items: any[]) => {
    void items;
    trackEvent({ event: 'create_order', orderId, amount: total });
  }
};
