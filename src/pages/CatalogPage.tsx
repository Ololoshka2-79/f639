import React, { useState } from 'react';
import { SlidersHorizontal, Plus, PackagePlus, X } from 'lucide-react';
import { useCatalogStore } from '../store/catalogStore';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { FilterModal } from '../components/catalog/FilterModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHaptics } from '../hooks/useHaptics';
import { useAdminStore } from '../store/adminStore';
import { useUIStore } from '../store/uiStore';
import { useProductStore } from '../store/productStore';

export const CatalogPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { selectedCategory, setSelectedCategory, searchQuery } = useCatalogStore();
  const { editMode } = useAdminStore();
  const { categoryNames, setCategoryName } = useUIStore();
  const { categories, addCategory, addProduct, removeCategory } = useProductStore();
  const haptics = useHaptics();
  const location = useLocation();
  const navigate = useNavigate();
  const isFavorites = location.pathname === '/favorites';

  const handleCategorySelect = (id: string | null) => {
    if (editMode) return;
    setSelectedCategory(id);
    haptics.selection();
  };

  const handleUpdateCategory = (id: string, name: string) => {
    setCategoryName(id, name);
    haptics.success();
  };

  const handleAddProduct = () => {
    const id = Math.random().toString(36).substr(2, 9);
    addProduct({
        title: 'Новое изделие',
        slug: `new-product-${id}`,
        description: '',
        price: 0,
        categoryId: selectedCategory || categories[0]?.id || '1',
        image: 'https://images.unsplash.com/photo-1605100804763-247f66156ce4?auto=format&fit=crop&q=80',
        gallery: [],
        images: [{ url: 'https://images.unsplash.com/photo-1605100804763-247f66156ce4?auto=format&fit=crop&q=80', public_id: '', order: 0 }],
        material: 'Золото',
        inStock: true,
        isNew: true,
        isBestSeller: false,
        isOnSale: false,
        isHidden: false
    });
    haptics.success();
    // navigate directly to new product
    navigate(`/product/${id}`);
  };

  return (
    <div className="min-h-screen pb-32 pt-6">
      <header className="px-6 mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-serif text-app-text">
          {isFavorites ? 'Избранное' : 'Каталог'}
        </h2>
        <div className="flex items-center gap-2">
          {editMode && !isFavorites && (
            <button 
              onClick={handleAddProduct}
              className="p-3 rounded-2xl bg-app-accent text-app-bg shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <PackagePlus size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Товар</span>
            </button>
          )}
          <button 
            onClick={() => { setIsFilterOpen(true); haptics.impactLight(); }}
            className="relative p-3 rounded-2xl bg-app-surface-1 border border-app-border text-app-accent hover:bg-app-accent/5 transition-all"
          >
            <SlidersHorizontal size={20} />
            {searchQuery && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-app-accent rounded-full border-2 border-app-bg" />
            )}
          </button>
        </div>
      </header>

      {/* Category Slider */}
      <section className="mb-8 pl-6 overflow-x-auto no-scrollbar flex items-center gap-4 py-2">
        <button
          onClick={() => handleCategorySelect(null)}
          className={`px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold border transition-all whitespace-nowrap ${
            selectedCategory === null 
              ? 'bg-app-accent border-app-accent text-app-bg' 
              : 'bg-app-surface-2 border-transparent text-app-text hover:bg-app-surface-hover'
          }`}
        >
          Все изделия
        </button>
        
        {categories.map((cat) => {
          const displayName = categoryNames[cat.id] || cat.name;
          return (
            <div key={cat.id} className="relative flex items-center shrink-0">
              <button
                onClick={() => handleCategorySelect(cat.id)}
                contentEditable={editMode}
                onBlur={(e) => handleUpdateCategory(cat.id, e.currentTarget.textContent || '')}
                suppressContentEditableWarning
                className={`px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-bold border transition-all whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-app-accent border-app-accent text-app-bg' 
                    : 'bg-app-surface-2 border-transparent text-app-text hover:bg-app-surface-hover'
                } ${editMode ? 'bg-white/10 outline-dashed outline-1 outline-app-accent cursor-text pr-8' : ''}`}
              >
                {displayName}
              </button>
              {editMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(window.confirm('Delete category?')) {
                      removeCategory(cat.id);
                      if (selectedCategory === cat.id) setSelectedCategory(null);
                    }
                  }}
                  className="absolute right-2 p-1 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}

        {editMode && (
          <button
            onClick={() => { 
                addCategory({ name: 'Новая категория', slug: 'new-category', sortOrder: categories.length + 1 }); 
                haptics.success(); 
            }}
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-app-accent/10 border border-app-accent/30 text-app-accent"
          >
            <Plus size={20} />
          </button>
        )}
      </section>

      {/* Results Header */}
      {searchQuery && (
        <div className="px-6 mb-6 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-app-text-muted font-bold">Результаты поиска для:</span>
          <span className="text-xs text-app-accent font-medium italic">"{searchQuery}"</span>
        </div>
      )}

      {/* Content */}
      <ProductGrid />

      <FilterModal 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
      />
    </div>
  );
};
