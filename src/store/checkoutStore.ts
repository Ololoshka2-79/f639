import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

export type DeliveryMode = 'pickup' | 'courier';
export type DeliveryFulfillment = 'yandex_pvz';

export interface ContactInfo {
  name: string;
  phone: string;
}

export interface DeliveryData {
  mode: DeliveryMode;
  fulfillment: DeliveryFulfillment;
  pvzId: string | null;
  address: string;
  comment?: string;
}

export const CHECKOUT_TOTAL_STEPS = 3;

interface CheckoutState {
  currentStep: number;
  contactInfo: ContactInfo;
  deliveryData: DeliveryData;
  checkoutBuyNowItem: CartItem | null;
  setStep: (step: number) => void;
  setContactInfo: (info: Partial<ContactInfo>) => void;
  setDeliveryData: (data: Partial<DeliveryData>) => void;
  setBuyNowItem: (product: Product, size?: string) => void;
  clearBuyNowItem: () => void;
  resetCheckout: () => void;
}

const defaultDelivery = (): DeliveryData => ({
  mode: 'pickup',
  fulfillment: 'yandex_pvz',
  pvzId: null,
  address: '',
});

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      currentStep: 1,
      contactInfo: {
        name: '',
        phone: '',
      },
      deliveryData: defaultDelivery(),
      checkoutBuyNowItem: null,
      setStep: (currentStep) => set({ currentStep }),
      setContactInfo: (info) =>
        set((state) => ({
          contactInfo: { ...state.contactInfo, ...info },
        })),
      setDeliveryData: (data) =>
        set((state) => ({
          deliveryData: { ...state.deliveryData, ...data },
        })),
      setBuyNowItem: (product, size) =>
        set({
          checkoutBuyNowItem: {
            id: `buy-now-${product.id}-${Date.now()}`,
            productId: product.id,
            product,
            size,
            quantity: 1,
          },
          currentStep: 1,
        }),
      clearBuyNowItem: () => set({ checkoutBuyNowItem: null }),
      resetCheckout: () =>
        set({
          currentStep: 1,
          contactInfo: { name: '', phone: '' },
          deliveryData: defaultDelivery(),
          checkoutBuyNowItem: null,
        }),
    }),
    { name: 'f639-checkout-storage' }
  )
);
