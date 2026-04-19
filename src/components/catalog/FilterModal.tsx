import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCatalogStore } from '../../store/catalogStore';
import type { SortOption } from '../../store/catalogStore';
import { Button } from '../ui/Button';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters, sortBy, setSortBy, resetFilters } = useCatalogStore();

  const sorts: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Популярное' },
    { value: 'new', label: 'Новинки' },
    { value: 'price_asc', label: 'Сначала дешевле' },
    { value: 'price_desc', label: 'Сначала дороже' },
  ];

  const handleApply = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-app-bg border-t-2 border-app-border-strong rounded-t-[32px] max-h-[calc(var(--tg-height,100vh)*0.9)] overflow-y-auto safe-area-bottom"
          >
            <div className="sticky top-0 z-10 bg-app-bg/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-app-border-strong">
              <h3 className="text-lg font-serif text-app-accent">Фильтр</h3>
              <button type="button" onClick={onClose} className="p-2 text-app-text hover:text-app-accent transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <section>
                <label className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold mb-3 block">
                  Сортировка
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sorts.map((sort) => (
                    <button
                      key={sort.value}
                      type="button"
                      onClick={() => setSortBy(sort.value)}
                      className={`px-4 py-3 rounded-xl text-[10px] uppercase tracking-wider font-semibold border-2 transition-all ${
                        sortBy === sort.value
                          ? 'bg-app-accent border-app-accent text-app-bg shadow-md'
                          : 'bg-app-surface-2 border-app-border-strong text-app-text'
                      }`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold mb-4 block">
                  Ценовой диапазон
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="От"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ minPrice: Number(e.target.value) || null })}
                    className="flex-1 bg-app-surface-1 border-2 border-app-border-strong rounded-xl py-3 px-4 text-sm text-app-text focus:outline-none focus:border-app-accent"
                  />
                  <div className="w-4 h-[2px] bg-app-border-strong" />
                  <input
                    type="number"
                    placeholder="До"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ maxPrice: Number(e.target.value) || null })}
                    className="flex-1 bg-app-surface-1 border-2 border-app-border-strong rounded-xl py-3 px-4 text-sm text-app-text focus:outline-none focus:border-app-accent"
                  />
                </div>
              </section>

              <div className="pt-6 flex gap-3">
                <Button variant="outline" className="flex-1 border-2 border-app-border-strong" onClick={() => resetFilters()}>
                  Сбросить
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleApply}>
                  Применить
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
