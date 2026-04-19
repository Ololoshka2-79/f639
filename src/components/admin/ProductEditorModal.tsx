import { X, Plus, Trash2, ImagePlus, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, type FC } from 'react';
import type { Product, Category } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { api } from '../../lib/api/endpoints';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialProduct?: Product;
  categories: Category[];
}

export const ProductEditorModal: FC<ProductEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  categories,
}) => {
  const haptics = useHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [priceInput, setPriceInput] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    slug: '',
    description: '',
    price: 0,
    oldPrice: undefined,
    categoryId: categories[0]?.id || '',
    inStock: true,
    image: '', // Keep for compatibility
    gallery: [], // Keep for compatibility
    images: [],
    isNew: true,
    isBestSeller: false,
    isOnSale: false,
    isHidden: false,
  });

  /* Sync form to props when the editor opens — intentional effect-driven reset */
  /* eslint-disable react-hooks/set-state-in-effect -- modal form must mirror initialProduct when dialog opens */
  useEffect(() => {
    if (!isOpen) return;
    setSaveError(null);
    if (initialProduct) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = initialProduct;
      // Ensure images array exists
      if (!rest.images || rest.images.length === 0) {
        rest.images = [];
        if (rest.image) rest.images.push({ url: rest.image, public_id: rest.image_public_id || '', order: 0 });
        if (rest.gallery) {
           rest.gallery.forEach((url, i) => {
             rest.images.push({ url, public_id: rest.gallery_public_ids?.[i] || '', order: i + 1 });
           });
        }
      }
      setFormData(rest as any);
      setPriceInput(rest.price > 0 ? String(rest.price) : '');
    } else {
      setPriceInput('');
      setFormData({
        title: '',
        slug: '',
        description: '',
        price: 0,
        oldPrice: undefined,
        categoryId: categories[0]?.id || '',
        inStock: true,
        image: '',
        gallery: [],
        images: [],
        isNew: true,
        isBestSeller: false,
        isOnSale: false,
        isHidden: false,
      });
    }
  }, [initialProduct, categories, isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !initialProduct && typeof value === 'string') {
        next.slug = value
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, '');
      }
      return next;
    });
  };

  const removePhotoAt = (index: number) => {
    setFormData((prev) => {
      let nextImages = [...prev.images];
      nextImages.splice(index, 1);
      nextImages = nextImages.map((img, idx) => ({ ...img, order: idx }));
      
      return {
        ...prev,
        images: nextImages,
        // Sync legacy fields
        image: nextImages[0]?.url || '',
        gallery: nextImages.slice(1).map(i => i.url)
      };
    });
  };

  const moveImage = (index: number, direction: number) => {
    setFormData((prev) => {
      const nextImages = [...prev.images];
      const targetIndex = index + direction;
      
      if (targetIndex < 0 || targetIndex >= nextImages.length) return prev;
      
      [nextImages[index], nextImages[targetIndex]] = [nextImages[targetIndex], nextImages[index]];
      
      const reordered = nextImages.map((img, idx) => ({ ...img, order: idx }));
      
      return {
        ...prev,
        images: reordered,
        image: reordered[0]?.url || '',
        gallery: reordered.slice(1).map(i => i.url)
      };
    });
  };

  const handlePickPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    haptics.selection();
    setSaveError(null);
    setIsUploadingImages(true);
    try {
      console.log(`[Admin] Uploading ${files.length} images...`);
      const uploaded = await Promise.all(
        Array.from(files).map((file) => api.admin.uploadImage(file))
      );
      setFormData((prev) => {
        let nextImages = [...prev.images, ...uploaded.map(item => ({ url: item.url, public_id: item.public_id, order: 0 }))];
        nextImages = nextImages.map((img, idx) => ({ ...img, order: idx }));
        return { 
          ...prev, 
          images: nextImages,
          // Sync legacy fields
          image: nextImages[0]?.url || '',
          gallery: nextImages.slice(1).map(i => i.url)
        };
      });
      console.log(`[Admin] Successfully uploaded ${uploaded.length} images.`);
    } catch (error) {
      console.error('[Admin] Upload failed', error);
      const message = error instanceof Error ? error.message : 'Upload failed';
      setSaveError(`Не удалось загрузить фото: ${message}`);
      haptics.error();
    } finally {
      setIsUploadingImages(false);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const normalized = priceInput.replace(/\s/g, '').replace(',', '.');
    const parsed = Math.round(Number.parseFloat(normalized));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setSaveError('Укажите корректную цену больше 0.');
      haptics.error();
      return;
    }
    if (!formData.image.trim()) {
      setSaveError('Добавьте главное фото товара.');
      haptics.error();
      return;
    }
    try {
      onSave({ ...formData, price: parsed });
      haptics.success();
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError('Не удалось сохранить. Попробуйте ещё раз.');
      haptics.error();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <div key="product-editor-modal" className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[32px] border-t border-app-border bg-app-surface-1 sm:rounded-[32px] sm:border"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-app-border bg-app-surface-1/80 p-6 backdrop-blur-md">
            <h3 className="font-serif text-xl text-app-text">
              {initialProduct ? 'Редактировать товар' : 'Новое украшение'}
            </h3>
            <button
              onClick={() => {
                onClose();
                haptics.impactLight();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border-strong bg-white/5 text-app-text transition-transform active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="custom-scrollbar flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                    Название товара
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-app-border-strong bg-app-surface-2 px-5 text-sm outline-none transition-colors focus:border-app-accent"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                    Описание
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full resize-none rounded-2xl border border-app-border-strong bg-app-surface-2 p-5 text-sm outline-none transition-colors focus:border-app-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                      Цена (₽)
                    </label>
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="Введите цену"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-app-border-strong bg-app-surface-2 px-5 text-sm outline-none transition-colors placeholder:text-app-text-muted/50 focus:border-app-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                      Старая цена
                    </label>
                    <input
                      type="number"
                      value={formData.oldPrice ?? ''}
                      onChange={(e) =>
                        handleChange('oldPrice', e.target.value ? parseInt(e.target.value, 10) : undefined)
                      }
                      className="h-12 w-full rounded-2xl border border-app-border-strong bg-app-surface-2 px-5 text-sm outline-none transition-colors focus:border-app-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                    Категория
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    className="h-12 w-full appearance-none rounded-2xl border border-app-border-strong bg-app-surface-2 px-5 text-sm outline-none transition-colors focus:border-app-accent"
                    style={{
                      backgroundImage:
                        'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffffff\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1.25rem center',
                      backgroundSize: '1rem',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column: Media and Toggles */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
                    Фото товара
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handlePickPhotos}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      haptics.impactLight();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploadingImages}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-app-border-strong bg-app-surface-2 py-4 text-sm font-semibold text-app-text transition-colors active:bg-white/5"
                  >
                    <ImagePlus size={20} className="text-app-accent" />
                    {isUploadingImages ? 'Загрузка...' : 'Добавить фото'}
                  </button>
                  <p className="text-[10px] text-app-text-muted">
                    Первое фото — обложка в каталоге. Можно выбрать несколько сразу.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((img, idx) => (
                      <div
                        key={`${idx}-${img.url.slice(-20)}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-app-border border-strong"
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                        {idx === 0 ? (
                          <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                            Обложка
                          </span>
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                haptics.impactLight();
                                moveImage(idx, -1);
                              }}
                              className="h-full bg-black/40 px-1 hover:bg-black/80"
                            >
                              <ArrowLeft size={16} className="text-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              haptics.impactLight();
                              removePhotoAt(idx);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 m-auto hover:bg-red-500"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                          {idx < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                haptics.impactLight();
                                moveImage(idx, 1);
                              }}
                              className="h-full bg-black/40 px-1 hover:bg-black/80"
                            >
                              <ArrowRight size={16} className="text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        haptics.impactLight();
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploadingImages}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-app-border-strong transition-colors hover:bg-white/5"
                    >
                      <Plus size={16} />
                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Ещё</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border-2 border-neutral-300 bg-neutral-100/80 p-6 dark:border-white/20 dark:bg-app-surface-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs font-bold text-app-text">Новинка</span>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-600 dark:text-app-text-muted">
                        Бейдж NEW
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isNew}
                      onClick={() => handleChange('isNew', !formData.isNew)}
                      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all ${formData.isNew ? 'border-neutral-900 bg-neutral-900 shadow-inner dark:border-app-accent dark:bg-app-accent' : 'border-neutral-400 bg-neutral-200 dark:border-white/30 dark:bg-white/10'}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full shadow-sm transition-all ${formData.isNew ? 'left-8 bg-white dark:bg-app-bg' : 'left-1 bg-white dark:bg-neutral-400'}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs font-bold text-app-text">Хит продаж</span>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-600 dark:text-app-text-muted">
                        Бейдж HIT
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isBestSeller}
                      onClick={() => handleChange('isBestSeller', !formData.isBestSeller)}
                      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all ${formData.isBestSeller ? 'border-neutral-900 bg-neutral-900 shadow-inner dark:border-app-accent dark:bg-app-accent' : 'border-neutral-400 bg-neutral-200 dark:border-white/30 dark:bg-white/10'}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full shadow-sm transition-all ${formData.isBestSeller ? 'left-8 bg-white dark:bg-app-bg' : 'left-1 bg-white dark:bg-neutral-400'}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs font-bold text-app-text">Sale</span>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-600 dark:text-app-text-muted">
                        Распродажа
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!formData.isOnSale}
                      onClick={() => handleChange('isOnSale', !formData.isOnSale)}
                      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all ${formData.isOnSale ? 'border-emerald-700 bg-emerald-600 shadow-inner dark:border-emerald-400 dark:bg-emerald-600' : 'border-neutral-400 bg-neutral-200 dark:border-white/30 dark:bg-white/10'}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full shadow-sm transition-all ${formData.isOnSale ? 'left-8 bg-white' : 'left-1 bg-white dark:bg-neutral-400'}`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t-2 border-neutral-300 pt-4 dark:border-white/15">
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs font-bold text-red-600">Скрытый товар</span>
                      <span className="text-[9px] uppercase tracking-widest text-red-600/70">
                        Не показывать в каталоге
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isHidden}
                      onClick={() => handleChange('isHidden', !formData.isHidden)}
                      className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all ${formData.isHidden ? 'border-red-600 bg-red-600 shadow-inner' : 'border-neutral-400 bg-neutral-200 dark:border-white/30 dark:bg-white/10'}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full shadow-sm transition-all ${formData.isHidden ? 'left-8 bg-white' : 'left-1 bg-white dark:bg-neutral-400'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {saveError ? (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] text-red-200">
                {saveError}
              </p>
            ) : null}

            <div className="sticky bottom-0 z-10 mt-12 flex gap-4 bg-gradient-to-t from-app-surface-1 via-app-surface-1 pt-4 transition-all">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-app-accent py-4 text-[10px] font-bold uppercase tracking-widest text-app-bg transition-transform active:scale-95"
              >
                {initialProduct ? 'Сохранить изменения' : 'Создать товар'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-app-border-strong bg-white/5 py-4 text-[10px] font-bold uppercase tracking-widest text-app-text-muted transition-transform active:scale-95"
              >
                Отмена
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
