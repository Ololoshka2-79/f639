import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CreditCard, Check } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useHaptics } from '../../hooks/useHaptics';
import { analytics } from '../../lib/analytics';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useProductStore } from '../../store/productStore';
import type { Product } from '../../types';

interface ProductCTAProps {
  product: Product;
  selectedSize?: string;
}

const btnClass =
  'relative flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-[10px] px-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 ease-out active:scale-[0.98]';

export const ProductCTA: React.FC<ProductCTAProps> = ({ product, selectedSize }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [showFlyout, setShowFlyout] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const setBuyNowItem = useCheckoutStore((s) => s.setBuyNowItem);
  const { editMode } = useAdminStore();
  const updateProduct = useProductStore((state) => state.updateProduct);
  const haptics = useHaptics();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    addItem(product, selectedSize);
    analytics.trackAddToCart(product, 1);
    setIsAdded(true);
    setShowFlyout(true);
    haptics.success();
    setTimeout(() => {
      setIsAdded(false);
      setShowFlyout(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    setBuyNowItem(product, selectedSize);
    analytics.trackBeginCheckout(
      [{ id: `buy-now-${product.id}`, productId: product.id, product, quantity: 1, size: selectedSize }],
      product.price,
    );
    haptics.impactMedium();
    navigate('/checkout');
  };

  return (
    <div className="fixed bottom-[104px] left-6 right-6 z-40 rounded-[12px] border border-app-border/80 bg-app-surface-1/95 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-3xl">
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ y: 0, opacity: 0, scale: 0.92 }}
            animate={{ y: -72, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center"
          >
            <div className="flex items-center gap-2 rounded-full bg-app-accent px-3 py-1.5 text-[10px] font-semibold text-app-bg shadow-xl">
              <ShoppingBag size={12} />
              +1
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <span
            contentEditable={editMode}
            suppressContentEditableWarning
            onBlur={(e) => {
              const val = parseInt(e.currentTarget.textContent?.replace(/\D/g, '') || '0');
              if (val > 0) updateProduct(product.id, { price: val });
            }}
            className={`text-[var(--price-large)] font-semibold leading-none ${
              editMode
                ? 'cursor-text rounded bg-white/10 px-1 outline outline-1 outline-dashed outline-app-accent'
                : 'text-app-accent'
            }`}
          >
            {editMode ? product.price : formatCurrency(product.price)}
          </span>
          {product.oldPrice ? (
            <span className="text-[9px] text-app-text-muted line-through">
              {formatCurrency(product.oldPrice)}
            </span>
          ) : null}
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={handleAddToCart}
            className={`${btnClass} border border-app-border-strong bg-app-surface-2 text-app-text hover:border-app-accent/40 hover:bg-app-surface-hover ${
              isAdded ? 'border-app-accent bg-app-accent text-app-bg' : ''
            }`}
          >
            <AnimatePresence mode="wait">
              {isAdded ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex items-center gap-1"
                >
                  <Check size={14} />
                  Ок
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex items-center gap-1"
                >
                  <ShoppingBag size={14} />
                  В корзину
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={handleBuyNow}
            className={`${btnClass} app-button-primary border-0 shadow-lg`}
          >
            <CreditCard size={14} />
            Купить
          </motion.button>
        </div>
      </div>
    </div>
  );
};
