import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

export type AdminProductSort = 'created' | 'title' | 'price' | 'popularity';

interface ProductToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: AdminProductSort) => void;
  onAddProduct: () => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortByChange,
  onAddProduct
}) => {
  const haptics = useHaptics();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Поиск товаров..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-12 rounded-2xl bg-app-surface-2 border border-app-border pl-12 pr-4 text-xs font-medium text-app-text outline-none focus:border-app-accent/50 transition-colors"
          />
        </div>
        <button 
           onClick={() => { onAddProduct(); haptics.impactMedium(); }}
           className="h-12 px-5 rounded-2xl bg-app-accent text-app-bg font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 active:scale-95 transition-transform shadow-[0_4px_20px_rgba(255,255,255,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Добавить товар</span>
        </button>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-app-surface-3 border border-app-border text-[10px] font-bold uppercase tracking-widest text-app-text-muted">
          Сортировка:
        </div>
        {[
          { label: 'По дате', value: 'created' },
          { label: 'По названию', value: 'title' },
          { label: 'По цене', value: 'price' },
          { label: 'Хиты', value: 'popularity' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => {
              onSortByChange(item.value as AdminProductSort);
              haptics.selection();
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
              sortBy === item.value 
                ? 'bg-app-accent border-app-accent text-app-bg' 
                : 'bg-app-surface-2 border-app-border text-app-text-muted hover:border-app-accent/30'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
