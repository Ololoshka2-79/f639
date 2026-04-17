import React from 'react';
import type { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Edit2, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface AdminProductCardProps {
  product: Product;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export const ProductCard: React.FC<AdminProductCardProps> = ({ 
  product, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggleVisibility 
}) => {
  const haptics = useHaptics();

  return (
    <div className={`p-4 rounded-3xl bg-app-surface-2 border border-app-border-strong flex flex-col gap-4 relative transition-all ${product.isHidden ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black flex-shrink-0">
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-serif text-app-text truncate">{product.title}</h4>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-app-accent font-bold text-xs">{formatCurrency(product.price)}</span>
            {product.oldPrice && (
              <span className="text-[10px] text-app-text-muted line-through">{formatCurrency(product.oldPrice)}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.isNew && (
               <span className="rounded-full border border-amber-700 bg-amber-400 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-neutral-900 dark:border-amber-300 dark:bg-amber-300 dark:text-black">
                 New
               </span>
            )}
            {product.isBestSeller && (
               <span className="rounded-full border border-rose-800 bg-rose-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                 Hit
               </span>
            )}
            {(product.isOnSale || (product.oldPrice != null && product.oldPrice > product.price)) && (
               <span className="rounded-full border border-emerald-900 bg-emerald-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
                 Sale
               </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button 
          onClick={() => { onEdit(); haptics.impactLight(); }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-app-border hover:bg-white/10 transition-colors group"
        >
          <Edit2 size={16} className="text-app-text-muted transition-colors group-hover:text-app-accent" />
          <span className="text-[8px] uppercase tracking-widest font-bold mt-1">Ред.</span>
        </button>
        <button 
          onClick={() => { onDuplicate(); haptics.impactLight(); }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-app-border hover:bg-white/10 transition-colors group"
        >
          <Copy size={16} className="text-app-text-muted transition-colors group-hover:text-app-accent" />
          <span className="text-[8px] uppercase tracking-widest font-bold mt-1">Дубл.</span>
        </button>
        <button 
          onClick={() => { onToggleVisibility(); haptics.selection(); }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-app-border hover:bg-white/10 transition-colors group"
        >
          {product.isHidden ? (
            <EyeOff size={16} className="text-red-500" />
          ) : (
            <Eye size={16} className="text-green-500" />
          )}
          <span className="text-[8px] uppercase tracking-widest font-bold mt-1">{product.isHidden ? 'Скр.' : 'Вид.'}</span>
        </button>
        <button 
          onClick={() => { onDelete(); haptics.impactMedium(); }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-app-border hover:bg-red-500/20 transition-colors group"
        >
          <Trash2 size={16} className="text-red-500/60 transition-colors group-hover:text-red-500" />
          <span className="text-[8px] uppercase tracking-widest font-bold mt-1">Удал.</span>
        </button>
      </div>
    </div>
  );
};
