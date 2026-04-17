import React from 'react';
import type { Category, Product } from '../../types';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface CategorySidebarProps {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddCategory: () => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  const haptics = useHaptics();

  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-app-text-muted">Категории</h4>
        <button 
          onClick={() => { onAddCategory(); haptics.impactLight(); }}
          className="p-1 px-2 rounded-lg bg-app-accent text-app-bg text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus size={10} />
          Добавить
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
            selectedCategoryId === null 
              ? 'bg-app-accent border-app-accent text-app-bg' 
              : 'bg-app-surface-2 border-app-border text-app-text-muted hover:border-app-accent/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Tag size={14} />
            <span className="text-xs font-serif">Все товары</span>
          </div>
          <span className={`text-[10px] font-bold ${selectedCategoryId === null ? 'opacity-60' : 'text-app-text-muted opacity-40'}`}>
            {products.length}
          </span>
        </button>

        {categories.map((cat) => (
          <div key={cat.id} className="relative group/cat">
            <button
              onClick={() => { onSelectCategory(cat.id); haptics.selection(); }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                selectedCategoryId === cat.id 
                  ? 'bg-app-accent border-app-accent text-app-bg' 
                  : 'bg-app-surface-2 border-app-border text-app-text-muted hover:border-app-accent/50'
              }`}
            >
              <div className="flex items-center gap-3 pr-12 truncate">
                <Tag size={14} className={selectedCategoryId === cat.id ? 'opacity-100' : 'opacity-40'} />
                <span className="text-xs font-serif truncate">{cat.name}</span>
              </div>
              <span className={`text-[10px] font-bold ${selectedCategoryId === cat.id ? 'opacity-60' : 'text-app-text-muted opacity-40'}`}>
                {getProductCount(cat.id)}
              </span>
            </button>
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity ${selectedCategoryId === cat.id ? 'opacity-100' : 'opacity-0 group-hover/cat:opacity-100'}`}>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditCategory(cat); haptics.impactLight(); }} 
                className={`p-1.5 rounded-lg transition-colors ${selectedCategoryId === cat.id ? 'hover:bg-black/10' : 'hover:bg-white/10'}`}
              >
                <Edit2 size={12} className={selectedCategoryId === cat.id ? 'text-app-bg' : 'text-app-text-muted'} />
              </button>
              <button 
                 onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); haptics.impactMedium(); }} 
                 className={`p-1.5 rounded-lg transition-colors ${selectedCategoryId === cat.id ? 'hover:bg-red-500/20' : 'hover:bg-red-500/20'}`}
              >
                <Trash2 size={12} className={selectedCategoryId === cat.id ? 'text-red-500' : 'text-red-500/60'} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
