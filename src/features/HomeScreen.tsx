import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../components/ui/ProductCard';
import { useMergedCatalogProducts } from '../hooks/useMergedCatalogProducts';
import { ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api/endpoints';

import { useUIStore } from '../store/uiStore';
import { useAdminStore } from '../store/adminStore';
import { useAnalyticsStore } from '../store/analyticsStore';
import { useHaptics } from '../hooks/useHaptics';

export const HomeScreen: React.FC = () => {
  const { products } = useMergedCatalogProducts();
  const navigate = useNavigate();
  const { setHomeHeroData, homeSectionTitle, homeSectionSubtitle } = useUIStore();
  const { editMode } = useAdminStore();
  const { events } = useAnalyticsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const haptics = useHaptics();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const handleUpdateHero = (field: 'title' | 'subtitle' | 'sectionTitle' | 'sectionSubtitle', value: string) => {
    setHomeHeroData({ [field]: value });
  };

  // Calculate popularity
  const productPopularity = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(e => {
      if (e.productId) {
        let weight = 0;
        if (e.event === 'view_product') weight = 1;
        if (e.event === 'add_to_cart') weight = 2;
        if (e.event === 'create_order') weight = 5;
        counts.set(e.productId, (counts.get(e.productId) || 0) + weight);
      }
    });
    return counts;
  }, [events]);

  const displayedProducts = useMemo(() => {
    // 1. Sort by popularity
    const sorted = [...products].sort((a, b) => {
      const popA = productPopularity.get(a.id) || 0;
      const popB = productPopularity.get(b.id) || 0;
      return popB - popA;
    });

    // 2. Filter by search
    if (!searchQuery.trim()) return sorted;
    const lowerQuery = searchQuery.toLowerCase();
    return sorted.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) || 
      (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
      (p.material && p.material.toLowerCase().includes(lowerQuery))
    );
  }, [products, productPopularity, searchQuery]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="pb-24"
    >

      {/* Search Bar */}
      <section className="px-6 mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={16} className="text-app-bg/50" />
          </div>
          <input
            type="search"
            enterKeyHint="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Поиск"
            className="tg-search-input w-full h-12 border border-app-border rounded-2xl pl-12 pr-4 text-base focus:outline-none focus:border-app-border-strong transition-all font-sans"
          />
        </div>
      </section>

      {/* Featured Collections */}
      <section className="px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 
            contentEditable={editMode}
            onBlur={(e) => handleUpdateHero('sectionTitle', e.currentTarget.textContent || '')}
            suppressContentEditableWarning
            className={`text-xl font-serif text-app-text tracking-wide ${editMode ? 'bg-white/5 outline-dashed outline-1 outline-app-accent px-1 rounded cursor-text' : ''}`}
          >
            {searchQuery ? 'Результаты поиска' : homeSectionTitle}
          </h2>
          {!searchQuery && (
            <div
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-app-text-muted transition-colors cursor-pointer"
            >
              <span
                onClick={() => {
                  if (!editMode) {
                    haptics.impactLight();
                    navigate('/catalog');
                  }
                }}
                contentEditable={editMode}
                onBlur={(e) => handleUpdateHero('sectionSubtitle', e.currentTarget.textContent || '')}
                suppressContentEditableWarning
                className={editMode ? 'bg-white/5 outline-dashed outline-1 outline-app-accent px-1 rounded cursor-text' : 'hover:text-app-accent'}
              >
                {homeSectionSubtitle}
              </span>
              <ChevronRight size={12} className={editMode ? 'opacity-50' : ''} />
            </div>
          )}
        </div>
        
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {displayedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => navigate(`/product/${product.id}-${product.slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-app-surface-1 rounded-2xl border border-dashed border-app-border">
            <Search size={32} className="text-app-text-muted/50 mb-3" />
            <p className="text-sm text-app-text-muted">Ничего не найдено</p>
            <p className="text-[10px] text-app-text-muted/50 mt-1 uppercase tracking-widest">Попробуйте изменить запрос</p>
          </div>
        )}
      </section>
    </motion.div>
  );
};
