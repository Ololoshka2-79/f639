import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useCartStore } from '../../store/cartStore';

const PARTICLE_OFFSETS: [number, number][] = [
  [24, -18], [-32, 22], [18, 36], [-40, -12], [12, -40],
  [-20, 28], [38, 8], [-14, -36],
];

interface OrderSuccessProps {
  orderId: string;
  /** После clearCart корзина пуста — передать число из момента оформления */
  itemsCount?: number;
  onContinue?: () => void;
}

export const OrderSuccess: React.FC<OrderSuccessProps> = ({
  orderId,
  itemsCount: itemsCountProp,
  onContinue,
}) => {
  const navigate = useNavigate();
  const { contactInfo, deliveryData } = useCheckoutStore();
  const cartItems = useCartStore((s) => s.items);
  const itemsCount = itemsCountProp ?? cartItems.length;

  const handleDone = () => {
    if (onContinue) {
      onContinue();
      return;
    }
    navigate('/');
  };

  return (
    <div className="no-scrollbar fixed inset-0 z-[200] flex flex-col items-center overflow-y-auto bg-app-bg p-8">
      <div className="relative mt-12 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-app-accent shadow-[0_0_30px_var(--app-border)]"
        >
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Check size={48} className="font-bold text-app-bg" />
          </motion.div>
        </motion.div>

        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: PARTICLE_OFFSETS[i]?.[0] ?? 0,
              y: PARTICLE_OFFSETS[i]?.[1] ?? 0,
            }}
            transition={{ duration: 1, delay: 0.2, repeat: Infinity, repeatDelay: 2 }}
            className="absolute h-1.5 w-1.5 rounded-full bg-app-accent/60"
          />
        ))}
      </div>

      <div className="mt-8 space-y-4 text-center">
        <h1 className="font-serif text-3xl text-app-text">Заявка отправлена</h1>
        <p className="inline-block rounded-full bg-app-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-app-accent">
          Номер: {orderId}
        </p>
      </div>

      <div className="mt-12 w-full space-y-6 rounded-[32px] border border-app-border bg-app-surface-1 p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-app-accent">
              <Package size={16} />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">
                Получатель
              </span>
              <p className="mt-0.5 text-sm text-app-text">{contactInfo.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-app-accent">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-app-text-muted">
                ПВЗ Яндекс
              </span>
              <p className="mt-0.5 line-clamp-2 text-sm text-app-text">{deliveryData.address}</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-app-text-muted" />
            <span className="text-xs font-medium text-app-text">
              {itemsCount} {itemsCount === 1 ? 'позиция' : 'позиций'}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-app-text-muted">
            Ожидайте звонка
          </span>
        </div>
      </div>

      <p className="mt-10 max-w-[280px] text-center text-[11px] leading-relaxed text-app-text-muted">
        Мы свяжемся с вами в ближайшее время для подтверждения заказа.
      </p>

      <button
        type="button"
        onClick={handleDone}
        className="app-button-primary group mt-12 flex h-14 w-full max-w-[280px] items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-widest shadow-xl"
      >
        К покупкам
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </button>

      <div className="pb-12" />
    </div>
  );
};
