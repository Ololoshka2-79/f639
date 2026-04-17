import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaymentStatus } from '../types';

interface PaymentState {
  paymentId: string | null;
  orderId: string | null;
  status: PaymentStatus;
  expiresAt: string | null;
  countdown: number;
  qrImage: string | null;
  deepLink: string | null;
  isPolling: boolean;
  lastCheckedAt: string | null;
  setPayment: (data: Partial<PaymentState>) => void;
  clearPayment: () => void;
  updateCountdown: () => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      paymentId: null,
      orderId: null,
      status: 'pending',
      expiresAt: null,
      countdown: 900,
      qrImage: null,
      deepLink: null,
      isPolling: false,
      lastCheckedAt: null,

      setPayment: (data) => set((state) => ({ ...state, ...data })),
      clearPayment: () => set({
        paymentId: null,
        orderId: null,
        status: 'pending',
        expiresAt: null,
        countdown: 900,
        qrImage: null,
        deepLink: null,
        isPolling: false,
        lastCheckedAt: null,
      }),
      updateCountdown: () => {
        const { expiresAt, status } = get();
        if (!expiresAt || status !== 'pending') return;
        const now = Date.now();
        const end = new Date(expiresAt).getTime();
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        set({ 
          countdown: diff, 
          status: diff <= 0 ? 'expired' : status 
        });
      }
    }),
    { name: 'f639-payment-storage' }
  )
);
