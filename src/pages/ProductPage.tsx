import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Heart, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../lib/api/endpoints';
import { queryKeys } from '../lib/queryKeys';
import { analytics } from '../lib/analytics';
import { Skeleton } from '../components/ui/Skeleton';
import { ProductGallery } from '../components/product/ProductGallery';
import { SizeSelector } from '../components/product/SizeSelector';
import { ProductCTA } from '../components/product/ProductCTA';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { useFavoritesStore } from '../store/favoritesStore';
import { useHaptics } from '../hooks/useHaptics';
import { useAdminStore } from '../store/adminStore';
import { useUIStore } from '../store/uiStore';
import { useProductStore } from '../store/productStore';
import type { Product } from '../types';
import { shareInTelegram } from '../lib/telegramShare';

export const ProductPage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { editMode } = useAdminStore();
  const storeProduct = useProductStore((s) => {
    const slug = idSlug?.split('-').slice(1).join('-') ?? '';
    const idPart = idSlug?.split('-')[0] ?? '';
    const bySlug = slug && s.products.find((p) => p.slug === slug);
    if (bySlug) return bySlug;
    return s.products.find((p) => p.id === idPart);
  });
  const { updateProduct, removeProduct } = useProductStore();
  const { customBadgeLabels } = useUIStore();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();

  // Extract slug from id-slug format
  const slug = idSlug?.split('-').slice(1).join('-');

  const { data: remoteProduct, isLoading, isError } = useQuery({
    queryKey: queryKeys.product(slug || ''),
    queryFn: () => api.products.get(slug || ''),
    enabled: !!slug,
  });

  const product = storeProduct ?? remoteProduct;

  // Metadata for sharing
  const shareUrl = window.location.href;
  const shareText = `Посмотри на это украшение: ${product?.title}`;

  const handleShareTelegram = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      shareInTelegram(shareUrl, shareText);
    } catch (err) {
      console.warn('[share]', err);
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
    haptics.impactLight();
    setIsShareSheetOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    haptics.impactMedium();
    setIsShareSheetOpen(false);
  };

  const handleUpdate = (field: keyof Product, value: string | number | boolean) => {
    if (!product) return;
    let finalValue = value;
    if (field === 'price') {
      finalValue = parseInt(value?.toString().replace(/\D/g, '') || '0') || 0;
    }
    updateProduct(product.id, { [field]: finalValue });
  };

  useEffect(() => {
    if (product) {
      analytics.trackViewItem(product);
    }
  }, [product]);

  if (isLoading && !product) {
    return (
      <div className="pb-32">
        <Skeleton className="w-full aspect-[4/5]" />
        <div className="px-6 py-8 space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full mt-8" />
        </div>
      </div>
    );
  }

  if ((isError && !product) || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-12 text-center">
        <h2 className="text-xl font-serif text-app-text mb-2">Украшение не найдено</h2>
        <button onClick={() => navigate('/catalog')} className="text-app-accent uppercase text-[10px] tracking-widest font-bold mt-4">
          Вернуться в каталог
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative pb-44"
    >
      {/* Share Sheet */}
      <AnimatePresence>
        {isShareSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareSheetOpen(false)}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col items-center rounded-t-[32px] border-t-2 border-app-border-strong bg-app-surface-1 px-6 pb-10 pt-2 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-8 mt-2 h-1 w-12 rounded-full bg-app-border-strong" />
              <h3 className="mb-8 font-serif text-lg font-semibold text-app-text">Поделиться</h3>
              
              <div className="w-full space-y-3">
                <button 
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-app-border-strong bg-app-accent py-4 text-[10px] font-bold uppercase tracking-widest text-app-bg shadow-md transition-colors hover:opacity-95 active:scale-[0.99]"
                >
                  <Share2 size={16} className="text-app-bg" />
                  Поделиться в Telegram
                </button>
                <button 
                  type="button"
                  onClick={handleCopyLink}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-app-border-strong bg-app-surface-2 py-4 text-[10px] font-bold uppercase tracking-widest text-app-text shadow-sm transition-colors hover:bg-app-surface-3 active:scale-[0.99]"
                >
                  <RefreshCw size={16} className="text-app-text" />
                  Копировать ссылку
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="absolute left-0 right-0 z-30 px-6 flex items-center justify-between pointer-events-none top-[calc(env(safe-area-inset-top,0px)+48px)]">
        <div className="h-10 w-10 flex-shrink-0 pointer-events-none" aria-hidden />
        <div className="flex gap-3 pointer-events-auto">
          <button 
            onClick={() => { haptics.impactLight(); setIsShareSheetOpen(true); }}
            className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-app-surface-1 border border-app-border-strong text-app-text shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-95 transition-transform"
          >
            <Share2 size={18} />
          </button>
          {!editMode ? (
            <button 
              onClick={() => { toggleFavorite(product); haptics.selection(); }}
              className={`w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-app-surface-1 border border-app-border-strong shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-95 transition-all ${
                isFavorite(product.id) ? 'text-app-accent' : 'text-app-text'
              }`}
            >
              <Heart size={18} fill={isFavorite(product.id) ? 'currentColor' : 'none'} />
            </button>
          ) : (
            <button 
              onClick={async () => { 
                if(window.confirm('Удалить товар?')) {
                  try {
                    await api.products.remove(product.id);
                  } catch (error) {
                    console.warn('[admin] remote delete failed, removing locally', error);
                  }
                  removeProduct(product.id);
                  haptics.impactMedium();
                  navigate('/catalog');
                }
              }}
              className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-app-surface-1 border border-app-border-strong text-red-500 shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-95 transition-transform"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      <ProductGallery 
        images={
          product.images && product.images.length > 0 
            ? product.images.map(img => img.url) 
            : [product.image, ...(product.gallery ?? [])]
        } 
      />

      {/* Product Content */}
      <div className="relative z-20 mt-[-32px] rounded-t-[32px] bg-app-surface-1 px-6 py-10 pb-14 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2 flex-wrap min-h-6">
            <span
              onClick={() => editMode && updateProduct(product.id, { isNew: !product.isNew })}
              className={`flex items-center rounded-[6px] border px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide backdrop-blur-md sm:text-[8px] ${
                product.isNew
                  ? 'border-amber-800/35 bg-[#92400e]/90 text-amber-50 dark:border-amber-200/25 dark:bg-[#b45309]/90'
                  : editMode 
                    ? 'cursor-pointer border-app-border-strong bg-white/5 text-white/40 opacity-50 hover:bg-white/10'
                    : 'hidden'
              }`}
            >
               {customBadgeLabels['new'] || 'New'}
            </span>
            <span
              onClick={() => editMode && updateProduct(product.id, { isBestSeller: !product.isBestSeller })}
              className={`flex items-center rounded-[6px] border px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide backdrop-blur-md sm:text-[8px] ${
                product.isBestSeller
                  ? 'border-rose-900/40 bg-[#9f1239]/90 text-rose-50'
                  : editMode 
                    ? 'cursor-pointer border-app-border-strong bg-white/5 text-white/40 opacity-50 hover:bg-white/10'
                    : 'hidden'
              }`}
            >
               {customBadgeLabels['hit'] || 'Hit'}
            </span>
            {(product.isOnSale || (product.oldPrice != null && product.oldPrice > product.price)) && (
              <span className="flex items-center rounded-[6px] border border-emerald-900/40 bg-[#065f46]/90 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-emerald-50 backdrop-blur-md sm:text-[8px]">
                {customBadgeLabels['sale'] || 'Sale'}
              </span>
            )}
            {product.isHidden && (
              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500 text-red-500 text-[8px] uppercase tracking-widest font-bold rounded-full">
                Hidden
              </span>
            )}
          </div>
          <h1 
            contentEditable={editMode}
            onBlur={(e) => handleUpdate('title', e.currentTarget.textContent || '')}
            suppressContentEditableWarning
            className={`text-3xl font-serif text-app-text leading-tight transition-all ${
              editMode 
                ? 'bg-white/5 outline-dashed outline-1 outline-app-accent/50 px-2 py-1 rounded select-text mb-2' 
                : ''
            }`}
          >
            {product.title}
          </h1>
        </div>

        {/* Size Selection */}
        {product.size && (
          <SizeSelector 
            sizes={[product.size]} 
            selectedSize={selectedSize} 
            onSelect={setSelectedSize} 
          />
        )}

        {/* Description */}
        <section className="mt-12 border-b border-neutral-500/[0.14] pb-12 dark:border-neutral-400/[0.12]">
          <p 
            contentEditable={editMode}
            onBlur={(e) => handleUpdate('description', e.currentTarget.textContent || '')}
            suppressContentEditableWarning
            className={`text-sm text-app-text/80 leading-relaxed font-light transition-all ${
              editMode 
                ? 'bg-white/5 outline-dashed outline-1 outline-app-accent/50 p-3 rounded select-text' 
                : ''
            }`}
          >
            {product.description}
          </p>
        </section>

        <RelatedProducts product={product} />
      </div>

      {/* Sticky Bottom CTA */}
      <ProductCTA product={product} selectedSize={selectedSize} />
    </motion.div>
  );
};
