import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../components/ui/ProductCard';
import { useMergedCatalogProducts } from '../hooks/useMergedCatalogProducts';
import { ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useUIStore } from '../store/uiStore';
import { useAdminStore } from '../store/adminStore';
import { useAnalyticsStore } from '../store/analyticsStore';
import { useHaptics } from '../hooks/useHaptics';

export const HomeScreen: React.FC = () => {
  const { products } = useMergedCatalogProducts();
  const navigate = useNavigate();
  const { homeHeroTitle, homeHeroSubtitle, homeHeroImage, setHomeHeroData, homeSectionTitle, homeSectionSubtitle } = useUIStore();
  const { editMode } = useAdminStore();
  const { events } = useAnalyticsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingHeroImage, setIsDraggingHeroImage] = useState(false);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
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

  const compressImageToDataUrl = async (file: File): Promise<string> => {
    const fileDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('Image read failed'));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = fileDataUrl;
    });

    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fileDataUrl;
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.84);
  };

  const handleHeroFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file);
      setHomeHeroData({ image: compressed });
      haptics.success();
    } catch {
      haptics.error();
    }
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
      {/* Compact Banner Row */}
      <section
        className={`relative h-[120px] overflow-hidden mt-2 mx-6 rounded-[24px] group transition-all duration-500 ${
          isDraggingHeroImage ? 'ring-2 ring-app-accent/60' : ''
        }`}
        onDragOver={(e) => {
          if (!editMode) return;
          e.preventDefault();
          setIsDraggingHeroImage(true);
        }}
        onDragLeave={() => {
          if (!editMode) return;
          setIsDraggingHeroImage(false);
        }}
        onDrop={(e) => {
          if (!editMode) return;
          e.preventDefault();
          setIsDraggingHeroImage(false);
          void handleHeroFiles(e.dataTransfer.files);
        }}
      >
        <motion.img
          src={homeHeroImage}
          alt="Luxury Jewelry"
          className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-app-bg/90 via-app-bg/50 to-transparent" />
        
        <div className="absolute inset-y-0 left-6 flex flex-col justify-center gap-0.5 max-w-[200px] z-10">
          <span 
            contentEditable={editMode}
            onBlur={(e) => handleUpdateHero('subtitle', e.currentTarget.textContent || '')}
            suppressContentEditableWarning
            className={`text-[8px] uppercase tracking-[0.4em] text-app-accent font-bold ${editMode ? 'bg-white/10 outline-dashed outline-1 outline-app-accent px-1 rounded cursor-text' : ''}`}
          >
            {homeHeroSubtitle}
          </span>
          <h2 
            contentEditable={editMode}
            onBlur={(e) => handleUpdateHero('title', e.currentTarget.textContent || '')}
            suppressContentEditableWarning
            className={`text-lg font-serif text-app-text leading-tight ${editMode ? 'bg-white/10 outline-dashed outline-1 outline-app-accent px-1 rounded cursor-text mt-1' : ''}`}
          >
            {homeHeroTitle}
          </h2>
          <div
            className="mt-1 text-[8px] text-app-text-muted uppercase tracking-widest font-bold flex items-center gap-1 cursor-pointer group/btn"
            onClick={() => {
              haptics.impactLight();
              navigate('/catalog');
            }}
          >
            Explore <ChevronRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
          </div>
        </div>

        {editMode && (
          <div className="absolute top-2 right-2 flex gap-2">
             <input
               ref={heroImageInputRef}
               type="file"
               accept="image/*"
               className="sr-only"
               onChange={(e) => void handleHeroFiles(e.target.files)}
             />
             <button 
               className="p-1.5 rounded-full bg-app-bg/80 text-app-accent border border-app-accent/30 hover:bg-app-accent hover:text-app-bg transition-colors"
               onClick={() => {
                 haptics.selection();
                 heroImageInputRef.current?.click();
               }}
               title="Загрузить обложку"
             >
               <div className="w-3 h-3 flex items-center justify-center">📷</div>
             </button>
             <button
               className="p-1.5 rounded-full bg-app-bg/80 text-app-accent border border-app-accent/30 hover:bg-app-accent hover:text-app-bg transition-colors"
               onClick={() => {
                 const newImg = prompt('Enter new image URL:', homeHeroImage);
                 if (newImg) setHomeHeroData({ image: newImg });
               }}
               title="Вставить URL"
             >
               <div className="w-3 h-3 flex items-center justify-center">🔗</div>
             </button>
          </div>
        )}
      </section>

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
