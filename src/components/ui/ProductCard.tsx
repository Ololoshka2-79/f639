import React from 'react';
import type { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useHaptics } from '../../hooks/useHaptics';
import { motion } from 'framer-motion';
import { useAdminStore } from '../../store/adminStore';
import { useProductStore } from '../../store/productStore';
import { useUIStore } from '../../store/uiStore';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

const badgeBase =
  'pointer-events-none inline-flex w-fit max-w-full items-center rounded-[6px] border px-1.5 py-0.5 text-[7px] font-semibold uppercase leading-none tracking-wide backdrop-blur-md transition-colors duration-200 sm:text-[8px]';

const dividerClass = 'border-b border-neutral-500/[0.14] dark:border-neutral-400/[0.12]';

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const addItem = useCartStore((state) => state.addItem);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const { editMode } = useAdminStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { customBadgeLabels } = useUIStore();
  const haptics = useHaptics();

  const showSale = product.isOnSale === true || (product.oldPrice != null && product.oldPrice > product.price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    haptics.impactMedium();
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product);
    haptics.selection();
  };

  const handleUpdate = (field: keyof Product, value: string | number | boolean) => {
    let finalValue: string | number | boolean | undefined = value;
    if (field === 'price' || field === 'oldPrice') {
      finalValue = parseInt(String(value).replace(/\D/g, ''), 10) || 0;
    }
    updateProduct(product.id, { [field]: finalValue } as Partial<Product>);
  };

  if (product.isHidden && !editMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={editMode ? {} : { y: -4 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative flex h-full flex-col rounded-[12px] border border-neutral-500/15 bg-app-surface-2 p-2 transition-all duration-200 ease-out dark:border-neutral-400/12 ${
        editMode ? 'cursor-default ring-2 ring-app-accent/25' : 'cursor-pointer hover:bg-app-surface-3'
      } ${product.isHidden ? 'opacity-50 grayscale' : ''}`}
      onClick={editMode ? undefined : onClick}
    >
      <div className="relative w-full shrink-0 overflow-hidden rounded-[10px] bg-[#f5f5f5] aspect-[4/5] dark:bg-[#141414]">
        {/* Horizontal Swiper */}
        <div 
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(!product.images || product.images.length === 0) ? (
            <div className="h-full w-full shrink-0 snap-center">
               <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover object-center transition-transform duration-[280ms] ease-out group-hover:scale-[1.03]"
              />
            </div>
          ) : (
            product.images.map((img, idx) => (
              <div key={`${img.public_id}-${idx}`} className="h-full w-full shrink-0 snap-center">
                <img
                  loading="lazy"
                  src={img.url.includes('cloudinary') ? img.url.replace('/upload/', '/upload/w_600,c_scale,q_auto,f_auto/') : img.url}
                  alt={`${product.title} - ${idx + 1}`}
                  className="h-full w-full object-cover object-center transition-transform duration-[280ms] ease-out group-hover:scale-[1.03]"
                />
              </div>
            ))
          )}
        </div>

        {/* Swiper Dots */}
        {product.images?.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
            {product.images.map((_, idx) => (
              <div 
                key={idx} 
                className="h-1 w-1 rounded-full bg-white/60 transition-all duration-300 first:bg-white first:w-2"
                style={{ 
                  // In a real swiper we'd track active index, but for native scroll we rely on first being visually active initially
                  // To be fully senior, we could add a scroll listener, but CSS scroll-snap is a great start.
                }}
              />
            ))}
          </div>
        )}

        {editMode && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-app-bg/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              className="rounded-full bg-app-accent p-3 text-app-bg shadow-2xl transition-transform duration-200 ease-out hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                const url = prompt('Link to new image:', product.image);
                if (url) handleUpdate('image', url);
              }}
            >
              🖼
            </button>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex max-w-[55%] flex-col gap-1">
          {product.isNew && (
            <span
              className={`${badgeBase} border-amber-800/35 bg-[#92400e]/90 text-amber-50 dark:border-amber-200/25 dark:bg-[#b45309]/90`}
            >
              {customBadgeLabels['new'] || 'New'}
            </span>
          )}
          {product.isBestSeller && (
            <span className={`${badgeBase} border-rose-900/40 bg-[#9f1239]/90 text-rose-50`}>
              {customBadgeLabels['hit'] || 'Hit'}
            </span>
          )}
          {showSale && (
            <span className={`${badgeBase} border-emerald-900/40 bg-[#065f46]/90 text-emerald-50`}>
              {customBadgeLabels['sale'] || 'Sale'}
            </span>
          )}
        </div>
        {!editMode && (
          <motion.button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFavorite(product.id) ? 'Убрать из избранного' : 'В избранное'}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            className={`pointer-events-auto absolute right-2 top-2 rounded-full border border-black/5 bg-white/90 p-1.5 shadow-sm backdrop-blur-md transition-all duration-200 ease-out dark:border-white/10 dark:bg-black/40 ${
              isFavorite(product.id)
                ? 'text-app-accent opacity-100'
                : 'text-neutral-900/70 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white'
            }`}
          >
            <motion.span
              key={isFavorite(product.id) ? 'on' : 'off'}
              initial={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <Heart size={14} strokeWidth={2} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
            </motion.span>
          </motion.button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-0.5 pt-2">
        <div className={`${dividerClass} pb-2`}>
          <h3
            contentEditable={editMode}
            onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
            suppressContentEditableWarning
            className={`line-clamp-2 min-h-[3.4rem] font-serif text-xl font-medium leading-snug tracking-tight text-app-text sm:min-h-[3.8rem] sm:text-2xl ${
              editMode
                ? 'select-text rounded bg-white/5 px-2 py-1 outline outline-1 outline-app-accent/50'
                : ''
            }`}
          >
            {product.title}
          </h3>
        </div>

        <div className="mt-auto flex min-h-[40px] flex-row items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 flex-shrink flex-col justify-center gap-0.5">
            <span
              contentEditable={editMode}
              onBlur={(e) => handleUpdate('price', e.currentTarget.textContent || '')}
              suppressContentEditableWarning
              className={`text-lg font-semibold leading-none text-app-accent ${
                editMode
                  ? 'select-text rounded bg-white/5 px-2 py-0.5 outline outline-1 outline-app-accent/50'
                  : ''
              }`}
            >
              {formatCurrency(product.price)}
            </span>
            {product.oldPrice != null && product.oldPrice > 0 ? (
              <span className="text-[9px] text-app-text-muted line-through">
                {formatCurrency(product.oldPrice)}
              </span>
            ) : null}
          </div>
          {!editMode && product.inStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-app-accent/35 bg-app-accent/10 text-app-accent transition-all duration-200 ease-out hover:bg-app-accent hover:text-app-bg active:scale-90"
              aria-label="В корзину"
            >
              <ShoppingBag size={16} />
            </button>
          )}
          {!product.inStock && (
            <span className="text-[8px] font-semibold uppercase tracking-tight text-app-text-muted">
              Ожидается
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
