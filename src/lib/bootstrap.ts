import { usePaymentStore } from '../store/paymentStore';

export const bootstrapApp = async () => {
  const { clearPayment } = usePaymentStore.getState();
  clearPayment();

  console.log('[Bootstrap] Application initialized.');
};
