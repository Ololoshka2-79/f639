
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CheckoutHeader } from '../components/checkout/CheckoutHeader';
import { ContactStep } from '../components/checkout/ContactStep';
import { DeliveryStep } from '../components/checkout/DeliveryStep';
import { SummaryStep } from '../components/checkout/SummaryStep';
import { OrderSuccess } from '../components/payment/OrderSuccess';
import { useCheckoutStore, CHECKOUT_TOTAL_STEPS } from '../store/checkoutStore';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { useOrderStore } from '../store/orderStore';
import { useHaptics } from '../hooks/useHaptics';
import { api } from '../lib/api/endpoints';
import { analytics } from '../lib/analytics';
import type { CheckoutItem } from '../types';

const ADDR_MIN = 8;


function phoneDigitsCount(phone: string): number {
  return phone.replace(/\D/g, '').length;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { currentStep, setStep, contactInfo, deliveryData, resetCheckout, checkoutBuyNowItem, clearBuyNowItem } =
    useCheckoutStore();
  const { items, clearCart } = useCartStore();
  const products = useProductStore((state) => state.products);

  const cartItemsBase = checkoutBuyNowItem ? [checkoutBuyNowItem] : items;

  const checkoutItems = useMemo(() => {
    return cartItemsBase.reduce<CheckoutItem[]>((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        acc.push({
          ...product,
          quantity: item.quantity,
          cartItemId: item.id,
          size: item.size
        } as CheckoutItem);
      }
      return acc;
    }, []);
  }, [cartItemsBase, products]);

  const checkoutTotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [checkoutItems]);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [successItemsCount, setSuccessItemsCount] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const hasTrackedCheckout = React.useRef(false);

  useEffect(() => {
    if (!hasTrackedCheckout.current && checkoutItems.length > 0) {
      analytics.trackBeginCheckout(checkoutItems as any, checkoutTotal); // Note: analytics type might need adjust if it wants CartItem
      hasTrackedCheckout.current = true;
    }
  }, [checkoutItems, checkoutTotal]);

  const phoneOk = phoneDigitsCount(contactInfo.phone) === 11;

  const isStepValid = (() => {
    switch (currentStep) {
      case 1:
        return contactInfo.name.trim().length >= 2 && phoneOk;
      case 2:
        return deliveryData.address.trim().length >= ADDR_MIN;
      case 3:
        return true;
      default:
        return false;
    }
  })();

  const deliveryOk = deliveryData.address.trim().length >= ADDR_MIN;
  const allStepsValid = contactInfo.name.trim().length >= 2 && phoneOk && deliveryOk;

  const handleSelectTab = (step: number) => {
    if (step < 1 || step > CHECKOUT_TOTAL_STEPS) return;
    setStep(step);
    haptics.selection();
    window.scrollTo(0, 0);
  };

  const validationHint = (): string => {
    const parts: string[] = [];
    if (contactInfo.name.trim().length < 2) parts.push('укажите имя');
    if (!phoneOk) parts.push('укажите полный номер телефона (10 цифр после +7)');
    if (!deliveryOk) parts.push('укажите адрес пункта выдачи (от 8 символов)');
    if (parts.length === 0) return 'Проверьте данные заказа.';
    return `Не хватает данных: ${parts.join('; ')}.`;
  };

  const handleSubmitOrder = async () => {
    if (checkoutItems.length === 0) {
      setOrderError('Корзина пуста. Добавьте товары и откройте оформление снова.');
      navigate('/cart', { replace: true });
      return;
    }

    if (!allStepsValid) {
      setOrderError(validationHint());
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setOrderError(null);
    setIsSubmitting(true);
    haptics.impactMedium();

    const itemCount = checkoutItems.length;

    try {
      const orderData = {
        items: checkoutItems.map((item) => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
        })),
        total: checkoutTotal,
        contactInfo: {
          name: contactInfo.name,
          phone: contactInfo.phone,
        },
        deliveryData: {
          ...deliveryData,
          address: deliveryData.address,
        },
      };

      const { orderId } = await api.orders.create(orderData);

      const { addOrder, addSavedAddress } = useOrderStore.getState();
      addOrder({
        id: orderId,
        status: 'awaiting_payment',
        date: new Date().toISOString(),
        total: checkoutTotal,
        items: checkoutItems as any,
        deliveryAddress: deliveryData.address,
      });

      addSavedAddress(deliveryData.address);

      analytics.trackPurchase(orderId, checkoutTotal, checkoutItems as any);
      if (checkoutBuyNowItem) {
        clearBuyNowItem();
      } else {
        clearCart();
      }
      setSuccessOrderId(orderId);
      setSuccessItemsCount(itemCount);
      haptics.success();

      // Показываем кастомный попап вместо редиректа на OrderSuccess
      setShowSuccessPopup(true);
    } catch (error) {
      haptics.error();
      console.error('Order creation failed', error);
      setOrderError('Не удалось отправить заявку. Проверьте соединение и попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < CHECKOUT_TOTAL_STEPS) {
      setStep(currentStep + 1);
      haptics.impactLight();
      window.scrollTo(0, 0);
    }
  };

  const handleContinueAfterSuccess = () => {
    clearBuyNowItem();
    resetCheckout();
    navigate('/');
  };

  const handleCloseSuccessPopup = useCallback(() => {
    setShowSuccessPopup(false);
    clearBuyNowItem();
    resetCheckout();
    navigate('/');
  }, [clearBuyNowItem, resetCheckout, navigate]);

  return (
    <div className="min-h-screen bg-app-bg pb-36">
      <CheckoutHeader currentStep={currentStep} totalSteps={CHECKOUT_TOTAL_STEPS} onSelectStep={handleSelectTab} />

      <main className="relative">
        {orderError ? (
          <div className="mx-6 mt-4 rounded-[10px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-[11px] text-app-text">
            {orderError}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {currentStep === 1 && <ContactStep />}
            {currentStep === 2 && <DeliveryStep />}
            {currentStep === 3 && <SummaryStep items={checkoutItems} total={checkoutTotal} />}
          </motion.div>
        </AnimatePresence>

        {/* Кастомный success-попап */}
        <AnimatePresence>
          {showSuccessPopup && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
                onClick={handleCloseSuccessPopup}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-6 right-6 z-[110] mx-auto max-w-md rounded-[24px] border border-app-border/80 bg-app-surface-1 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
                style={{ top: '30vh' }}
              >
                <button
                  type="button"
                  onClick={handleCloseSuccessPopup}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-app-surface-2 text-app-text-muted hover:bg-app-surface-3 transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-app-accent/15">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-accent">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="mb-3 text-lg font-serif text-app-text">Заказ оформлен</h3>
                  <p className="text-sm text-app-text-muted leading-relaxed">
                    С вами свяжутся в ближайшее время для подтверждения и оплаты
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      <div className="pointer-events-none fixed bottom-6 left-6 right-6 z-50">
        <div className="pointer-events-auto mx-auto max-w-md rounded-[12px] border border-app-border/80 bg-app-surface-1/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid || isSubmitting}
              className={`flex min-h-[52px] w-full items-center justify-center rounded-[10px] px-4 text-center text-[11px] font-semibold uppercase tracking-widest transition-all duration-200 ease-out ${isStepValid && !isSubmitting
                ? 'app-button-primary active:scale-[0.98]'
                : 'cursor-not-allowed border border-app-border/80 bg-white/5 text-app-text-muted'
                }`}
            >
              Далее
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmitOrder()}
              disabled={isSubmitting}
              className={`flex min-h-[52px] w-full items-center justify-center rounded-[10px] px-4 text-center text-[11px] font-semibold uppercase tracking-widest transition-all duration-200 ease-out ${allStepsValid && !isSubmitting
                ? 'app-button-primary active:scale-[0.98]'
                : 'cursor-not-allowed border border-app-border/80 bg-white/5 text-app-text-muted'
                }`}
            >
              {isSubmitting ? (
                <span className="animate-pulse">Отправка…</span>
              ) : (
                <span>Оформить заказ</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
