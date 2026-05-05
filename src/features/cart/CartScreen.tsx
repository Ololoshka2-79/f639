import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { useCartStore } from '../../store/cartStore';
import { useMergedCatalogProducts } from '../../hooks/useMergedCatalogProducts';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { useHaptics } from '../../hooks/useHaptics';
import type { CartItem, Product } from '../../types';

interface CartScreenProps {
  onCheckout: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onCheckout }) => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, addItem } = useCartStore();
  const clearBuyNowItem = useCheckoutStore(s => s.clearBuyNowItem);
  const { data: products = [] } = useMergedCatalogProducts();
  const haptics = useHaptics();
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{ cartItem: CartItem; product: Product } | null>(null);

  const cartItemsWithProducts = useMemo(() => {
    return items
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null;
        return { item, product };
      })
      .filter((x): x is { item: CartItem; product: Product } => x !== null);
  }, [items, products]);

  const total = useMemo(() => {
    return cartItemsWithProducts.reduce((sum, { item, product }) => sum + product.price * item.quantity, 0);
  }, [cartItemsWithProducts]);

  useEffect(() => {
    clearBuyNowItem();
  }, [clearBuyNowItem]);

  useEffect(() => {
    if (!undoItem) return;
    const t = window.setTimeout(() => setUndoItem(null), 4500);
    return () => window.clearTimeout(t);
  }, [undoItem]);

  const handleDelete = (item: CartItem, product: Product) => {
    removeItem(item.id);
    setUndoItem({ cartItem: item, product });
    setSwipedItemId(null);
    haptics.impactLight();
  };

  const handleUndo = () => {
    if (!undoItem) return;
    for (let i = 0; i < undoItem.cartItem.quantity; i += 1) {
      addItem(undoItem.product, undoItem.cartItem.size);
    }
    setUndoItem(null);
    haptics.success();
  };


  if (cartItemsWithProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center pb-32">
        <ShoppingBag className="w-16 h-16 text-app-text-muted/40 mb-6" strokeWidth={1} />
        <h2 className="text-xl font-serif text-app-text mb-2">Корзина пуста</h2>
        <p className="text-sm text-app-text-muted mb-8">Добавьте украшения из каталога</p>
        <Button variant="gold" onClick={() => navigate('/catalog')}>
          В каталог
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-64 px-6"
    >
      <h2 className="text-2xl font-serif text-app-text mb-8">Корзина</h2>

      <ul className="space-y-4 mb-10">
        {cartItemsWithProducts.map(({ item, product }) => (
          <li key={item.id} className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface-1">
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-500 text-white"
              onClick={() => handleDelete(item, product)}
            >
              <Trash2 size={16} />
            </button>

            <motion.div
              drag="x"
              dragConstraints={{ left: -120, right: 0 }}
              dragElastic={0.15}
              animate={{ x: swipedItemId === item.id ? -96 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onDragEnd={(_, info) => {
                const threshold = 120;
                const velocityThreshold = 800;

                if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
                  setSwipedItemId(item.id);
                  haptics.selection();
                } else if (info.offset.x > 60 || info.velocity.x > 400) {
                  setSwipedItemId(null);
                } else if (swipedItemId === item.id && info.offset.x < 30) {
                  setSwipedItemId(item.id);
                } else {
                  setSwipedItemId(null);
                }
              }}
              className="relative flex gap-4 bg-app-surface-1 p-4"
            >
              <div
                className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f5] dark:bg-[#141414]"
                onClick={() => {
                  haptics.impactLight();
                  navigate(`/product/${product.id}-${product.slug}`);
                }}
              >
                <img src={product.image} alt="" className="h-full w-full object-contain object-center" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif text-app-text line-clamp-2">{product.title}</p>
                <p className="text-[var(--price-small)] font-semibold text-app-text mt-1">{formatCurrency(product.price)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-app-bg border border-app-border text-app-text"
                    onClick={() => {
                      haptics.selection();
                      updateQuantity(item.id, Math.max(1, item.quantity - 1));
                    }}
                  >
                    −
                  </button>
                  <span className="text-sm tabular-nums w-6 text-center">{item.quantity}</span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-app-bg border border-app-border text-app-text"
                    onClick={() => {
                      haptics.selection();
                      updateQuantity(item.id, item.quantity + 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="p-2 self-start text-app-text-muted hover:text-red-500 transition-colors"
                onClick={() => handleDelete(item, product)}
                aria-label="Удалить"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          </li>
        ))}
      </ul>

      {undoItem ? (
        <div className="fixed bottom-[9.5rem] left-6 right-6 z-50">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-app-border/80 bg-app-surface-1/95 px-4 py-3 text-sm backdrop-blur-xl">
            <span className="line-clamp-1">Товар удален</span>
            <button type="button" className="text-app-accent text-xs uppercase tracking-widest" onClick={handleUndo}>
              Отменить
            </button>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 p-6 pb-28 bg-gradient-to-t from-app-bg via-app-bg to-transparent pointer-events-none z-50">
        <div className="pointer-events-auto max-w-md mx-auto space-y-4">
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-[10px] uppercase tracking-widest text-app-text-muted">Итого</span>
              <span className="text-[var(--price-large)] font-bold text-app-accent">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button variant="gold" fullWidth className="h-14" onClick={onCheckout}>
            Продолжить
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
